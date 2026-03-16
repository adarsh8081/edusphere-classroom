import { db } from "../../core/database/db";
import { eq, and } from "drizzle-orm";
import { users, notificationPreferences, type User, type InsertUser } from "@edusphere/types";
import { log } from "../../core/logger/index";

export class AuthRepository {
    async getUser(id: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const [user] = await db.insert(users).values(insertUser as any).returning();
        return user;
    }

    async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(
            and(eq(users.provider, provider), eq(users.providerId, providerId))
        );
        return user;
    }

    async createOAuthUser(data: { email: string; name: string; role: string; provider: string; providerId: string; avatarUrl?: string }): Promise<User> {
        const [user] = await db.insert(users).values({
            email: data.email,
            name: data.name,
            role: data.role,
            provider: data.provider,
            providerId: data.providerId,
            avatarUrl: data.avatarUrl || null,
        }).returning();
        return user;
    }

    async updateUserProfile(userId: string, data: { name?: string; bio?: string; skills?: string[]; avatarUrl?: string }): Promise<any> {
        const [updated] = await db.update(users)
            .set({ ...data })
            .where(eq(users.id, userId))
            .returning();
        return updated;
    }

    async updateUserRole(userId: string, role: string): Promise<any> {
        const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
        return updated;
    }

    async deleteUser(userId: string): Promise<void> {
        await db.delete(users).where(eq(users.id, userId));
    }

    async getAllUsers(roleFilter?: string, search?: string): Promise<any[]> {
        let query = db.select().from(users);
        // Note: Add logic for filters if needed, similar to storage.ts
        return await query;
    }
}

export const authRepository = new AuthRepository();
