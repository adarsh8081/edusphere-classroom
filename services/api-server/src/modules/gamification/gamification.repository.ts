import { db } from "../../core/database/db";
import { xpTransactions, userLevels, badges, userBadges, users } from "@edusphere/types";
import { eq, sql, desc, and } from "drizzle-orm";

export class GamificationRepository {
    async getBadges() {
        return await db.select().from(badges);
    }

    async seedBadges(badgesData: any[]) {
        for (const b of badgesData) {
            try {
                await db.insert(badges).values(b).onConflictDoNothing();
            } catch (e) { /* already exists */ }
        }
    }

    async ensureUserLevel(userId: string) {
        let existing = await db.select().from(userLevels).where(eq(userLevels.userId, userId)).limit(1);
        if (existing.length === 0) {
            await db.insert(userLevels).values({ userId, totalXp: 0, level: 1, streak: 0 });
            existing = await db.select().from(userLevels).where(eq(userLevels.userId, userId)).limit(1);
        }
        return existing[0];
    }

    async insertXPTransaction(userId: string, amount: number, reason: string, classId?: string, referenceId?: string) {
        await db.insert(xpTransactions).values({ userId, amount, reason, classId, referenceId });
    }

    async addUserXpAndGetLevel(userId: string, amount: number) {
        await db.update(userLevels)
            .set({
                totalXp: sql`${userLevels.totalXp} + ${amount}`,
                lastActiveAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(userLevels.userId, userId));

        const [ul] = await db.select().from(userLevels).where(eq(userLevels.userId, userId)).limit(1);
        return ul;
    }

    async updateUserLevel(userId: string, newLevel: number) {
        await db.update(userLevels).set({ level: newLevel }).where(eq(userLevels.userId, userId));
    }

    async getEarnedBadges(userId: string) {
        return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    }

    async awardBadge(userId: string, badgeId: string) {
        await db.insert(userBadges).values({ userId, badgeId }).onConflictDoNothing();
    }

    async awardBadgeBonusXp(userId: string, badgeSlug: string, xpBonus: number) {
        await db.insert(xpTransactions).values({ userId, amount: xpBonus, reason: `badge_earned_${badgeSlug}` });
        await db.update(userLevels)
            .set({ totalXp: sql`${userLevels.totalXp} + ${xpBonus}`, updatedAt: new Date() })
            .where(eq(userLevels.userId, userId));
    }

    async updateUserStreak(userId: string, newStreak: number, now: Date) {
        await db.update(userLevels)
            .set({ streak: newStreak, lastActiveAt: now, updatedAt: now })
            .where(eq(userLevels.userId, userId));
    }

    async getUserProfile(userId: string) {
        const [ul] = await db.select().from(userLevels).where(eq(userLevels.userId, userId)).limit(1);
        return ul;
    }

    async getUserEarnedBadgesWithDetails(userId: string) {
        return await db.select({ badge: badges, earnedAt: userBadges.earnedAt })
            .from(userBadges)
            .innerJoin(badges, eq(userBadges.badgeId, badges.id))
            .where(eq(userBadges.userId, userId))
            .orderBy(desc(userBadges.earnedAt));
    }

    async getRecentXpTransactions(userId: string, limit: number = 10) {
        return await db.select()
            .from(xpTransactions)
            .where(eq(xpTransactions.userId, userId))
            .orderBy(desc(xpTransactions.createdAt))
            .limit(limit);
    }

    async getClassLeaderboardData(classId: string) {
        const result = await db.execute(sql`
        SELECT 
          u.id, u.name, u.avatar_url,
          COALESCE(ul.total_xp, 0) as total_xp,
          COALESCE(ul.level, 1) as level,
          COALESCE(ul.streak, 0) as streak,
          ROW_NUMBER() OVER (ORDER BY COALESCE(ul.total_xp, 0) DESC) as rank
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        LEFT JOIN user_levels ul ON ul.user_id = u.id
        WHERE e.class_id = ${classId}
        ORDER BY total_xp DESC
        LIMIT 20
      `);
        return result.rows;
    }
}

export const gamificationRepository = new GamificationRepository();
