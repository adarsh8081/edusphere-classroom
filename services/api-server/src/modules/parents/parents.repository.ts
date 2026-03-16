import { db } from "../../core/database/db";
import { eq, and } from "drizzle-orm";
import { parentStudents, parentInvitations, users } from "@edusphere/types";

export class ParentsRepository {
    async linkParentToStudent(parentId: string, studentId: string) {
        await db.insert(parentStudents).values({ parentId, studentId }).onConflictDoNothing();
    }

    async getLinkedChildren(parentId: string) {
        const links = await db.select().from(parentStudents).where(eq(parentStudents.parentId, parentId));
        const children = [];
        for (const link of links) {
            const [child] = await db.select().from(users).where(eq(users.id, link.studentId));
            if (child) children.push(child);
        }
        return children;
    }

    async createParentInvitation(studentId: string, parentEmail: string, token: string, expiresAt: Date) {
        const [inv] = await db.insert(parentInvitations).values({ studentId, parentEmail, token, expiresAt }).returning();
        return inv;
    }

    async getParentInvitation(token: string) {
        const [inv] = await db.select().from(parentInvitations).where(eq(parentInvitations.token, token));
        return inv;
    }

    async updateParentInvitationStatus(id: string, status: string) {
        await db.update(parentInvitations).set({ status }).where(eq(parentInvitations.id, id));
    }

    async getStudentById(studentId: string) {
        const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
        return student;
    }

    async getAttendanceForStudent(studentId: string) {
        const { attendance } = await import("@edusphere/types");
        return await db.select().from(attendance).where(eq(attendance.studentId, studentId));
    }

    async getSubmissionsForStudent(studentId: string) {
        const { submissions } = await import("@edusphere/types");
        return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
    }

    async getRecentSubmissionsForStudent(studentId: string) {
        const { submissions, assignments } = await import("@edusphere/types");
        const { desc } = await import("drizzle-orm");

        return await db
            .select({
                id: submissions.id,
                assignmentTitle: assignments.title,
                submittedAt: submissions.submittedAt,
                grade: submissions.grade,
            })
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .where(eq(submissions.studentId, studentId))
            .orderBy(desc(submissions.submittedAt))
            .limit(5);
    }

    async getParentStudentLinks() {
        return await db.select().from(parentStudents);
    }

    async getLinkedStudentsWithDetails(parentId: string) {
        return await db
            .select({
                studentId: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl,
            })
            .from(parentStudents)
            .innerJoin(users, eq(parentStudents.studentId, users.id))
            .where(eq(parentStudents.parentId, parentId));
    }

    async createParentUser(email: string, name: string, passwordHash: string) {
        const [parent] = await db.insert(users).values({
            email,
            name,
            password: passwordHash,
            role: "parent",
        }).returning();
        return parent;
    }

    async getPendingInvitation(token: string) {
        const [invitation] = await db
            .select()
            .from(parentInvitations)
            .where(and(eq(parentInvitations.token, token), eq(parentInvitations.status, "pending")))
            .limit(1);
        return invitation;
    }

    async getUserById(userId: string) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        return user;
    }

    async insertParentMessage(parentId: string, teacherId: string, studentId: string, content: string, senderId: string) {
        const { parentMessages } = await import("@db/schemas");
        const [message] = await db.insert(parentMessages).values({
            parentId,
            teacherId,
            studentId,
            content,
            senderId,
        }).returning();
        return message;
    }

    async fetchParentMessages(parentId: string, teacherId: string, studentId: string) {
        const { parentMessages } = await import("@db/schemas");
        const { desc } = await import("drizzle-orm");
        return await db
            .select()
            .from(parentMessages)
            .where(
                and(
                    eq(parentMessages.parentId, parentId),
                    eq(parentMessages.teacherId, teacherId),
                    eq(parentMessages.studentId, studentId)
                )
            )
            .orderBy(desc(parentMessages.createdAt));
    }
}

export const parentsRepository = new ParentsRepository();
