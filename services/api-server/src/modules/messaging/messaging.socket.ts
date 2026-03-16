import { Server, Socket } from "socket.io";
import { messagingRepository } from "./messaging.repository";

export function registerMessagingHandlers(io: Server, socket: Socket) {
    socket.on("join_conversation", async (conversationId: string) => {
        try {
            const user = (socket.request as any).user;
            // Validate user is part of the conversation
            const conversations = await messagingRepository.getConversations(user.id);
            const isMember = conversations.some(c => c.id === conversationId);

            if (!isMember) {
                return socket.emit("error", { message: "Not authorized to join this conversation" });
            }

            socket.join(`conversation:${conversationId}`);
            console.log(`User ${user.id} joined conversation: ${conversationId}`);
        } catch (err) {
            console.error("Error joining conversation:", err);
            socket.emit("error", { message: "Error joining conversation" });
        }
    });

    socket.on("send_message", async (data: { conversationId: string, content: string }) => {
        try {
            const user = (socket.request as any).user;
            const message = await messagingRepository.sendMessage(data.conversationId, user.id, data.content);
            io.to(`conversation:${data.conversationId}`).emit("new_message", message);
        } catch (err) {
            console.error("Error sending message:", err);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    socket.on("typing", (data: { conversationId: string }) => {
        const user = (socket.request as any).user;
        socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
            conversationId: data.conversationId,
            userId: user.id
        });
    });
}
