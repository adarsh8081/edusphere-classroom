import { db } from "../../core/database/db";
import { eq, and, sql } from "drizzle-orm";
import { userActivities, assignments, submissions, classes, users, enrollments, type User } from "@edusphere/types";

export class AnalyticsRepository {
    async getEngagementHeatmap(classId: string) {
        return await db.select().from(userActivities).where(eq(userActivities.classId, classId));
    }

    async getAssignmentStats(assignmentId: string) {
        // Implement assignment statistics calculation
        const assignmentData = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
        if (!assignmentData.length) return null;

        const subs = await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
        return {
            assignment: assignmentData[0],
            submissionsCount: subs.length,
            submissions: subs
        };
    }

    async getStudentAttendance(studentId: string, classId: string) {
        // Mock method since we do not have an attendance schema yet
        return [];
    }

    async getStudentSubmissions(studentId: string, classId: string) {
        return await db.select()
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .where(and(eq(submissions.studentId, studentId), eq(assignments.classId, classId)));
    }

    async getAssignments(classId: string) {
        return await db.select().from(assignments).where(eq(assignments.classId, classId));
    }

    async updateStudentRisk(studentId: string, classId: string, riskScore: number, factors: string[]) {
        // Mock DB call. In real implementation, there's a risk table.
        console.log(`Updated risk for student ${studentId} in class ${classId}: ${riskScore} factors: ${factors}`);
    }

    async getUser(userId: string) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        return user;
    }

    async getClass(classId: string) {
        const [cls] = await db.select().from(classes).where(eq(classes.id, classId));
        return cls;
    }

    async getCoreTotals() {
        const { wellbeingCheckins } = await import("@edusphere/types");
        const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
        const [classCount] = await db.select({ count: sql<number>`count(*)` }).from(classes);
        const [wellbeingCount] = await db.select({ count: sql<number>`count(*)` }).from(wellbeingCheckins);
        return { userCount, classCount, wellbeingCount };
    }

    async getDailyActivityHeatmap(thirtyDaysAgo: Date) {
        const { posts, wellbeingCheckins } = await import("@edusphere/types");
        return await db.execute(sql`
            SELECT 
                DATE_TRUNC('day', "created_at") as date,
                COUNT(*) as count
            FROM (
                SELECT "created_at" FROM ${posts} WHERE "created_at" >= ${thirtyDaysAgo}
                UNION ALL
                SELECT "created_at" FROM ${submissions} WHERE "created_at" >= ${thirtyDaysAgo}
                UNION ALL
                SELECT "created_at" FROM ${wellbeingCheckins} WHERE "created_at" >= ${thirtyDaysAgo}
            ) activity_logs
            GROUP BY date
            ORDER BY date ASC
        `);
    }

    async getClassPerformanceRankings() {
        const { posts } = await import("@edusphere/types");
        const { desc } = await import("drizzle-orm");
        return await db.select({
            id: classes.id,
            name: classes.name,
            studentCount: sql<number>`count(DISTINCT ${enrollments.studentId})`,
            postCount: sql<number>`count(DISTINCT ${posts.id})`,
            assignmentCount: sql<number>`count(DISTINCT ${assignments.id})`
        })
            .from(classes)
            .leftJoin(enrollments, eq(classes.id, enrollments.classId))
            .leftJoin(posts, eq(classes.id, posts.classId))
            .leftJoin(assignments, eq(classes.id, assignments.classId))
            .groupBy(classes.id)
            .orderBy(desc(sql`count(DISTINCT ${posts.id})`))
            .limit(10);
    }

    async getInstitutionalWellbeingBaseline() {
        const { wellbeingCheckins } = await import("@edusphere/types");
        const [avgMood] = await db.select({
            score: sql<number>`ROUND(AVG(CAST("mood_score" AS NUMERIC)), 2)`,
            flaggedCount: sql<number>`COUNT(CASE WHEN "is_flagged" = true THEN 1 END)`
        }).from(wellbeingCheckins);
        return avgMood;
    }
}

export const analyticsRepository = new AnalyticsRepository();
