/**
 * PERFORMANCE LOAD TESTING
 * Uses `autocannon` to load test core API endpoints.
 * 
 * Run with:
 *   npx ts-node src/tests/performance/load.test.ts
 * 
 * Or with environment variable for target URL:
 *   API_BASE_URL=http://your-api-url npx ts-node src/tests/performance/load.test.ts
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface BenchmarkResult {
    route: string;
    requests: { total: number; average: number; };
    latency: { mean: number; p99: number; };
    throughput: { average: number; };
    passed: boolean;
    reason?: string;
}

const THRESHOLDS = {
    maxMeanLatencyMs: 200,   // p50 mean latency under 200ms
    maxP99LatencyMs: 1000,   // p99 under 1 second
    minRequestsPerSec: 50,   // At least 50 rps
};

async function benchmark(
    title: string,
    url: string,
    options: Partial<autocannon.Options> = {}
): Promise<BenchmarkResult> {
    console.log(`\n🔄 Running load test: ${title}`);
    console.log(`   URL: ${url}`);

    const result = await autocannon({
        url,
        connections: 10,
        duration: 10, // 10 seconds
        pipelining: 1,
        ...options,
    });

    const passed =
        result.latency.mean < THRESHOLDS.maxMeanLatencyMs &&
        result.latency.p99 < THRESHOLDS.maxP99LatencyMs &&
        result.requests.average >= THRESHOLDS.minRequestsPerSec;

    const summary: BenchmarkResult = {
        route: title,
        requests: { total: result.requests.total, average: result.requests.average },
        latency: { mean: result.latency.mean, p99: result.latency.p99 },
        throughput: { average: result.throughput.average },
        passed,
        reason: !passed ? buildFailReason(result) : undefined,
    };

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${title}`);
    console.log(`   Requests/sec: ${result.requests.average.toFixed(2)}`);
    console.log(`   Latency mean: ${result.latency.mean.toFixed(2)}ms`);
    console.log(`   Latency p99:  ${result.latency.p99.toFixed(2)}ms`);
    if (!passed) console.log(`   ⚠️  FAILED: ${summary.reason}`);

    return summary;
}

function buildFailReason(result: autocannon.Result): string {
    const reasons: string[] = [];
    if (result.latency.mean >= THRESHOLDS.maxMeanLatencyMs)
        reasons.push(`mean latency ${result.latency.mean.toFixed(0)}ms >= ${THRESHOLDS.maxMeanLatencyMs}ms`);
    if (result.latency.p99 >= THRESHOLDS.maxP99LatencyMs)
        reasons.push(`p99 latency ${result.latency.p99.toFixed(0)}ms >= ${THRESHOLDS.maxP99LatencyMs}ms`);
    if (result.requests.average < THRESHOLDS.minRequestsPerSec)
        reasons.push(`rps ${result.requests.average.toFixed(0)} < ${THRESHOLDS.minRequestsPerSec}`);
    return reasons.join('; ');
}

async function runSuite() {
    console.log('🚀 EduSphere API — Performance Load Test Suite');
    console.log('='.repeat(50));
    console.log(`Target: ${BASE_URL}`);
    console.log(`Thresholds: mean < ${THRESHOLDS.maxMeanLatencyMs}ms, p99 < ${THRESHOLDS.maxP99LatencyMs}ms, rps >= ${THRESHOLDS.minRequestsPerSec}`);

    const results: BenchmarkResult[] = [];

    // ── 1. Health check endpoint (public, should be very fast) ────────────────
    results.push(await benchmark('GET /api/health', `${BASE_URL}/api/health`));

    // ── 2. Auth endpoint — rate limited, so use fewer connections ─────────────
    results.push(await benchmark(
        'POST /api/auth/login (invalid creds)',
        `${BASE_URL}/api/auth/login`,
        {
            connections: 5,
            duration: 5,
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: 'loadtest@example.com', password: 'wrong' }),
        }
    ));

    // ── 3. Classes list (protected, will return 401 without session — tests overhead) ──
    results.push(await benchmark(
        'GET /api/classes (unauthenticated — tests 401 overhead)',
        `${BASE_URL}/api/classes`,
        { connections: 10, duration: 10 }
    ));

    // ── 4. Analytics endpoint ─────────────────────────────────────────────────
    results.push(await benchmark(
        'GET /api/analytics/summary (unauthenticated)',
        `${BASE_URL}/api/analytics/summary`,
        { connections: 10, duration: 10 }
    ));

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(50));
    console.log('📊 Performance Test Summary');
    console.log('='.repeat(50));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        const icon = r.passed ? '✅' : '❌';
        console.log(`${icon} ${r.route} | mean: ${r.latency.mean.toFixed(1)}ms | p99: ${r.latency.p99.toFixed(1)}ms | rps: ${r.requests.average.toFixed(0)}`);
    }

    console.log(`\nTotal: ${results.length} benchmarks — ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        console.log('\n🔴 Some benchmarks failed threshold checks. Review the routes above.');
        process.exit(1);
    } else {
        console.log('\n🟢 All benchmarks passed!');
    }
}

runSuite().catch(err => {
    console.error('Load test failed with error:', err);
    process.exit(1);
});
