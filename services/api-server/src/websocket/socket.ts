import { Server, Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisPublisher, redisSubscriber, isRedisConnected } from "../core/redis";
import { sessionMiddleware } from "../modules/auth/auth.strategies";
import passport from "passport";
import { registerMessagingHandlers } from "../modules/messaging/messaging.socket";

const wrap = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);

export function setupSocket(server: HttpServer) {
    const ioOptions: ConstructorParameters<typeof Server>[1] = {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    };

    // Only use Redis adapter if Redis was successfully connected
    if (isRedisConnected) {
        ioOptions.adapter = createAdapter(redisPublisher, redisSubscriber);
        console.log("[Socket.IO] Using Redis adapter");
    } else {
        console.log("[Socket.IO] Redis not available, using in-memory adapter");
    }

    const io = new Server(server, ioOptions);

    // Apply express middlewares to Socket.io
    io.use(wrap(sessionMiddleware));
    io.use(wrap(passport.initialize()));
    io.use(wrap(passport.session()));

    io.use((socket, next) => {
        const req = socket.request as any;
        if (req.user) {
            // Assign user to a personal room
            socket.join(`user:${req.user.id}`);
            next();
        } else {
            next(new Error("unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const user = (socket.request as any).user;
        console.log(`User connected: ${socket.id} (User ID: ${user.id})`);

        // Register module-specific handlers
        registerMessagingHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id} (User ID: ${user.id})`);
        });
    });

    return io;
}
