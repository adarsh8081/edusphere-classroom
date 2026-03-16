import { db } from "../../core/database/db";
import { attendanceSessions, attendanceRecords, users, enrollments } from "@edusphere/types";
import { eq, and, gt, desc, sql } from "drizzle-orm";

export class AttendanceRepository {
    async createSession(classId: string, teacherId: string, qrCode: string, expiresAt: Date) {
        const [session] = await db.insert(attendanceSessions).values({
            classId,
            teacherId,
            qrCode,
            expiresAt,
        }).returning();
        return session;
    }

    async getActiveSessionByQrCode(qrCode: string) {
        const [session] = await db
            .select()
            .from(attendanceSessions)
            .where(
                and(
                    eq(attendanceSessions.qrCode, qrCode),
                    gt(attendanceSessions.expiresAt, new Date())
                )
            )
            .limit(1);
        return session;
    }

    async getAttendanceRecord(sessionId: string, studentId: string) {
        const [existing] = await db
            .select()
            .from(attendanceRecords)
            .where(
                and(
                    eq(attendanceRecords.sessionId, sessionId),
                    eq(attendanceRecords.studentId, studentId)
                )
            )
            .limit(1);
        return existing;
    }

    async markAttendance(sessionId: string, studentId: string, latitude?: string, longitude?: string) {
        await db.insert(attendanceRecords).values({
            sessionId,
            studentId,
            latitude,
            longitude,
        });
    }

    async getActiveSessionByClass(classId: string) {
        const [session] = await db
            .select()
            .from(attendanceSessions)
            .where(
                and(
                    eq(attendanceSessions.classId, classId),
                    gt(attendanceSessions.expiresAt, new Date())
                )
            )
            .orderBy(desc(attendanceSessions.createdAt))
            .limit(1);
        return session;
    }

    async getSessionRecords(sessionId: string) {
        return await db
            .select({
                id: attendanceRecords.id,
                studentId: attendanceRecords.studentId,
                studentName: users.name,
                studentAvatar: users.avatarUrl,
                scannedAt: attendanceRecords.scannedAt,
            })
            .from(attendanceRecords)
            .innerJoin(users, eq(attendanceRecords.studentId, users.id))
            .where(eq(attendanceRecords.sessionId, sessionId))
            .orderBy(desc(attendanceRecords.scannedAt));
    }

    async getAttendanceForExport(classId: string) {
        return await db
            .select({
                studentName: users.name,
                date: sql<string>`COALESCE(${attendanceRecords.scannedAt}::date::text, CURRENT_DATE::text)`,
                scannedAt: attendanceRecords.scannedAt,
                status: sql<string>`CASE WHEN ${attendanceRecords.id} IS NOT NULL THEN 'present' ELSE 'absent' END`
            })
            .from(users)
            .innerJoin(enrollments, eq(enrollments.studentId, users.id))
            .leftJoin(attendanceRecords, eq(attendanceRecords.studentId, users.id))
            .where(eq(enrollments.classId, classId));
    }
}

export const attendanceRepository = new AttendanceRepository();
