import { Server } from "socket.io";
import { type Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisPublisher, redisSubscriber, isRedisConnected } from "./redis";
import { storage } from "./storage";

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

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join_conversation", (conversationId: string) => {
            socket.join(conversationId);
            console.log(`User joined conversation: ${conversationId}`);
        });

        socket.on("send_message", async (data: { conversationId: string, senderId: string, content: string }) => {
            const message = await storage.sendMessage(data.conversationId, data.senderId, data.content);
            io.to(data.conversationId).emit("new_message", message);
        });

        socket.on("typing", (data: { conversationId: string, userId: string }) => {
            socket.to(data.conversationId).emit("user_typing", data);
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    return io;
}
