import { db } from "../../core/database/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { users, classes, userActivities, wellbeingCheckins, type InsertUser } from "@edusphere/types";

export class AdminRepository {
    async getAdminStats() {
        const [totalUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users);
        const [totalClasses] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(classes);
        return {
            totalUsers: totalUsers?.count || 0,
            totalClasses: totalClasses?.count || 0
        };
    }

    async getAllUsers(role?: string, search?: string) {
        let qs = db.select().from(users).$dynamic();
        if (role) qs = qs.where(eq(users.role, role));
        if (search) qs = qs.where(ilike(users.name, `%${search}%`));
        return await qs.orderBy(desc(users.createdAt));
    }

    async updateUserRole(userId: string, role: string) {
        const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
        return updated;
    }

    async deleteUser(userId: string) {
        await db.delete(users).where(eq(users.id, userId));
    }

    async getAllClassesAdmin() {
        return await db.select().from(classes).orderBy(desc(classes.createdAt));
    }

    async deleteClass(classId: string) {
        await db.delete(classes).where(eq(classes.id, classId));
    }

    async getRecentActivity(limit: number) {
        return await db.select().from(userActivities).orderBy(desc(userActivities.createdAt)).limit(limit);
    }

    async getAllFlaggedWellbeing() {
        return await db.select().from(wellbeingCheckins).where(eq(wellbeingCheckins.isFlagged, true)).orderBy(desc(wellbeingCheckins.createdAt));
    }
}

export const adminRepository = new AdminRepository();
