import { db } from "../../core/database/db";
import { eq, and, desc } from "drizzle-orm";
import { wellbeingCheckins, users } from "@edusphere/types";

export class WellbeingRepository {
    async createWellbeingCheckin(checkin: any) {
        const [created] = await db.insert(wellbeingCheckins).values(checkin).returning();
        return created;
    }

    async updateCheckinFlag(id: string, isFlagged: boolean, aiSentimentScore: number) {
        await db.update(wellbeingCheckins)
            .set({ isFlagged, aiSentimentScore })
            .where(eq(wellbeingCheckins.id, id));
    }

    async getWellbeingAnalytics(classId: string) {
        return await db.select().from(wellbeingCheckins).where(eq(wellbeingCheckins.classId, classId)).orderBy(desc(wellbeingCheckins.createdAt));
    }

    async getAllFlaggedWellbeing() {
        return await db.select().from(wellbeingCheckins).where(eq(wellbeingCheckins.isFlagged, true));
    }

    async getStudentWellbeing(studentId: string, limit: number) {
        return await db.select().from(wellbeingCheckins)
            .where(eq(wellbeingCheckins.studentId, studentId))
            .orderBy(desc(wellbeingCheckins.createdAt))
            .limit(limit);
    }

    async getAtRiskStudents(classId: string) {
        // Find distinct students who have had flagged checkins in this class.
        // It should join users and wellbeingCheckins. Simplest implementation for now:
        const flagged = await db.select({
            studentId: wellbeingCheckins.studentId,
        }).from(wellbeingCheckins)
            .where(and(eq(wellbeingCheckins.classId, classId), eq(wellbeingCheckins.isFlagged, true)));

        const ids = Array.from(new Set(flagged.map(f => f.studentId)));
        if (ids.length === 0) return [];

        // Fetch user data for these student IDs
        const students = [];
        for (const id of ids) {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            if (user) students.push(user);
        }
        return students;
    }
}

export const wellbeingRepository = new WellbeingRepository();
