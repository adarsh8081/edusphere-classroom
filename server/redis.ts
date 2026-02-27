import { createClient } from 'redis';

// ──────────────────────────────────────────────────────────────────────────────
// Redis URL detection.
// • Local:   redis://127.0.0.1:6379  (plain TCP)
// • Upstash: rediss://<password>@<host>:6379  (TLS, "rediss" with double-s)
// ──────────────────────────────────────────────────────────────────────────────
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

/** True once at least the main client successfully connects. */
export let isRedisConnected = false;

// ──────────────────────────────────────────────────────────────────────────────
// Client factory — TLS socket options vary by connection type to satisfy TS.
// ──────────────────────────────────────────────────────────────────────────────
const reconnectStrategy = (retries: number) => {
    if (retries > 10) return new Error('Redis: too many reconnect attempts');
    return Math.min(100 * Math.pow(2, retries), 5000);
};

function makeClient() {
    if (isTLS) {
        // Upstash / managed Redis — uses rediss:// with TLS
        return createClient({
            url: redisUrl,
            socket: {
                tls: true,
                rejectUnauthorized: false, // Upstash uses self-signed certs on some plans
                reconnectStrategy,
                connectTimeout: 8000,
            },
        });
    }
    // Local Redis — plain TCP
    return createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy,
            connectTimeout: 8000,
        },
    });
}

export const redisClient = makeClient();
export const redisPublisher = redisClient.duplicate();
export const redisSubscriber = redisClient.duplicate();

// ──────────────────────────────────────────────────────────────────────────────
// Suppress repeated error noise — only log the first error per client.
// ──────────────────────────────────────────────────────────────────────────────
let redisErrorLogged = false;
const onRedisError = (name: string) => (err: Error) => {
    if (!redisErrorLogged) {
        console.warn(`[Redis] ${name} error (will retry silently):`, (err as any).code || err.message);
        redisErrorLogged = true;
    }
};

redisClient.on('error', onRedisError('Client'));
redisPublisher.on('error', onRedisError('Publisher'));
redisSubscriber.on('error', onRedisError('Subscriber'));

redisClient.on('connect', () => {
    redisErrorLogged = false;
    isRedisConnected = true;
    console.log(`[Redis] Client connected${isTLS ? ' (TLS/Upstash)' : ''}`);
});

redisClient.on('reconnecting', () => {
    console.log('[Redis] Reconnecting…');
});

// ──────────────────────────────────────────────────────────────────────────────
// Connect with a race-condition timeout so a down Redis doesn't stall boot.
// ──────────────────────────────────────────────────────────────────────────────
export async function connectRedis() {
    const connectWithTimeout = (
        client: ReturnType<typeof createClient>,
        name: string,
        timeoutMs = 8000
    ) =>
        Promise.race([
            client.connect(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${name} connection timed out after ${timeoutMs}ms`)), timeoutMs)
            ),
        ]);

    try {
        await connectWithTimeout(redisClient, 'Client');
        await connectWithTimeout(redisPublisher, 'Publisher');
        await connectWithTimeout(redisSubscriber, 'Subscriber');
        isRedisConnected = true;
        console.log('[Redis] Connected to Redis server and pub/sub channels.');
        if (isTLS) console.log('[Redis] Using TLS connection (Upstash / managed Redis).');
    } catch (err: any) {
        isRedisConnected = false;
        console.warn('[Redis] Connection failed — continuing without Redis.', err.message);
        console.warn('[Redis] Tip: Set REDIS_URL=rediss://:password@host:6379 for Upstash.');
    }
}
