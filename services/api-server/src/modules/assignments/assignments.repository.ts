import { db } from "../../core/database/db";
import { eq, and } from "drizzle-orm";
import {
    assignments, submissions, reviews, prerequisites, userActivities,
    type InsertAssignment, type InsertSubmission
} from "@edusphere/types";

export class AssignmentsRepository {
    async getAssignments(classId: string) {
        return await db.select().from(assignments).where(eq(assignments.classId, classId));
    }

    async getAssignment(id: string) {
        const [a] = await db.select().from(assignments).where(eq(assignments.id, id));
        return a;
    }

    async createAssignment(data: any) {
        const [a] = await db.insert(assignments).values(data).returning();
        return a;
    }

    async addPrerequisite(prerequisiteId: string, prerequisiteType: string, itemId: string, itemType: string) {
        await db.insert(prerequisites).values({
            dependentOnId: prerequisiteId,
            dependentOnType: prerequisiteType,
            requiredForId: itemId,
            requiredForType: itemType
        });
    }

    async logActivity(userId: string, classId: string, actionType: string, resourceId: string) {
        await db.insert(userActivities).values({
            userId,
            classId,
            activityType: actionType,
            referenceId: resourceId
        });
    }

    async getSubmissions(assignmentId: string) {
        return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
    }

    async getSubmission(id: string) {
        const [sub] = await db.select().from(submissions).where(eq(submissions.id, id));
        return sub;
    }

    async createSubmission(data: any) {
        const [sub] = await db.insert(submissions).values(data).returning();
        return sub;
    }

    async gradeSubmission(id: string, grade: string, feedback?: string) {
        const [sub] = await db.update(submissions)
            .set({ grade, feedback })
            .where(eq(submissions.id, id))
            .returning();
        return sub;
    }

    async updateSubmissionPlagiarism(id: string, similarityScore: number, report: any) {
        const [sub] = await db.update(submissions)
            .set({ plagiarismScore: similarityScore, plagiarismReport: report })
            .where(eq(submissions.id, id))
            .returning();
        return sub;
    }

    async getReviewsForAssignment(assignmentId: string) {
        return await db.select().from(reviews).where(eq(reviews.assignmentId, assignmentId));
    }

    async updateReviewModeration(id: string, score: number, isFlagged: boolean, moderatedBy: string) {
        const [rev] = await db.update(reviews)
            .set({ score: String(score), isFlagged, reviewerId: moderatedBy }) // In a real system you'd have moderatedBy
            .where(eq(reviews.id, id))
            .returning();
        return rev;
    }

    async getAttendance(classId: string, date: string) {
        // Mock method for generic getAttendance mapped from storage
        return [];
    }

    async markAttendance(classId: string, date: string, records: any[], userId: string) {
        // Mock markAttendance mapped from storage
    }
    async assignPeerReviews(assignmentId: string) {
        // Mock method for assignPeerReviews mapped from storage
    }

    async createPeerReview(data: { submissionId: string; reviewerId: string; assignmentId: string; content: string; score: number }): Promise<any> {
        try {
            const [review] = await db.insert(reviews).values({
                ...data,
                score: data.score.toString()
            }).returning();
            return review;
        } catch (error) {
            console.error("[AssignmentsRepository] Error creating peer review:", error);
            throw error;
        }
    }

    async getExistingPeerReview(submissionId: string, reviewerId: string) {
        const [rev] = await db.select().from(reviews).where(
            and(eq(reviews.submissionId, submissionId), eq(reviews.reviewerId, reviewerId))
        );
        return rev;
    }
}

export const assignmentsRepository = new AssignmentsRepository();
