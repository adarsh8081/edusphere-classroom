import { db } from "../../core/database/db";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { botConversations, learningPathItems, learningGaps, aiStudyPlans, documentChunks, assignments, submissions, userActivities } from "@edusphere/types";

export class AIRepository {
    async searchDocumentChunks(embedding: number[], k: number = 3) {
        // We use raw SQL with pgvector for nearest neighbor
        // Make sure the embedding is formatted as '[1,2,3...]'
        const vectorStr = JSON.stringify(embedding);
        const matches = await db.execute(sql`
            SELECT id, "resourceId", content, embedding <-> ${vectorStr}::vector AS distance
            FROM "document_chunks"
            ORDER BY distance
            LIMIT ${k};
        `);
        return matches.rows as any[];
    }

    async createVectorExtension() {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    }

    async getBotConversations(classId: string, userId: string) {
        return await db.select().from(botConversations)
            .where(and(eq(botConversations.classId, classId), eq(botConversations.userId, userId)))
            .orderBy(desc(botConversations.createdAt))
            .limit(20);
    }

    async saveBotConversation(userId: string, classId: string, question: string, answer: string, sources: string[]) {
        const [saved] = await db.insert(botConversations).values({
            userId, classId, question, answer, sources
        }).returning();
        return saved;
    }

    async generateLearningPath(userId: string, classId: string) {
        // Mock method for generating a path
        return {
            id: "mock-path-id",
            userId, classId, title: "Personalized Path", description: "AI generated path"
        };
    }

    async completeLearningPathItem(itemId: string) {
        await db.update(learningPathItems).set({ status: 'completed' }).where(eq(learningPathItems.id, itemId));
    }

    async getLearningGaps(userId: string, classId: string) {
        return await db.select().from(learningGaps).where(and(eq(learningGaps.studentId, userId), eq(learningGaps.classId, classId)));
    }

    async updateLearningGap(gapData: any) {
        const [gap] = await db.insert(learningGaps).values(gapData).returning();
        return gap;
    }

    async getAIStudyPlan(studentId: string, classId: string) {
        const [plan] = await db.select().from(aiStudyPlans)
            .where(and(eq(aiStudyPlans.studentId, studentId), eq(aiStudyPlans.classId, classId), eq(aiStudyPlans.isCurrent, true)));
        return plan;
    }

    async createAIStudyPlan(planData: any) {
        await db.update(aiStudyPlans).set({ isCurrent: false }).where(and(eq(aiStudyPlans.studentId, planData.studentId), eq(aiStudyPlans.classId, planData.classId)));
        const [plan] = await db.insert(aiStudyPlans).values(planData).returning();
        return plan;
    }

    async getUserSubmissionsForClass(classId: string, studentId: string) {
        const result = await db.select({
            assignmentId: submissions.assignmentId,
            grade: submissions.grade,
            feedback: submissions.feedback
        })
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .where(and(eq(assignments.classId, classId), eq(submissions.studentId, studentId)));
        return result;
    }

    async getStudentSkills(studentId: string) {
        return []; // placeholder
    }

    async getEngagementHeatmap(classId: string) {
        return await db.select().from(userActivities).where(eq(userActivities.classId, classId));
    }

    async getAssignments(classId: string, studentId: string) {
        return await db.select().from(assignments).where(eq(assignments.classId, classId));
    }
    async insertDocumentChunks(chunks: any[]) {
        if (chunks.length === 0) return;
        await db.insert(documentChunks).values(chunks);
    }
}

export const aiRepository = new AIRepository();
