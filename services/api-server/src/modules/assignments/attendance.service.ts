import { attendanceRepository } from "./attendance.repository";
import crypto from "crypto";
import { awardXP } from "../gamification/gamification.service";

export const ATTENDANCE_XP = 15; // XP for being present
export const SESSION_DURATION_MINS = 10;

export async function startAttendanceSession(classId: string, teacherId: string) {
    const qrCode = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_DURATION_MINS);

    const session = await attendanceRepository.createSession(classId, teacherId, qrCode, expiresAt);
    return session;
}

export async function markAttendance(qrCode: string, studentId: string, latitude?: number, longitude?: number) {
    // 1. Find active session
    const session = await attendanceRepository.getActiveSessionByQrCode(qrCode);

    if (!session) {
        throw new Error("Invalid or expired QR code");
    }

    // 2. Check if already marked
    const existing = await attendanceRepository.getAttendanceRecord(session.id, studentId);

    if (existing) {
        return { message: "Attendance already marked", alreadyMarked: true };
    }

    // 3. Mark attendance
    await attendanceRepository.markAttendance(session.id, studentId, latitude?.toString(), longitude?.toString());

    // 4. Award XP
    const xpResult = await awardXP(studentId, ATTENDANCE_XP, "attendance_marked", session.classId, session.id);

    return { message: "Attendance marked successfully!", xpAwarded: ATTENDANCE_XP, ...xpResult };
}

export async function getActiveSession(classId: string) {
    const session = await attendanceRepository.getActiveSessionByClass(classId);
    return session;
}

export async function getSessionStats(sessionId: string) {
    const records = await attendanceRepository.getSessionRecords(sessionId);

    return {
        count: records.length,
        students: records,
    };
}
export async function exportAttendanceToCSV(classId: string) {
    const records = await attendanceRepository.getAttendanceForExport(classId);

    const header = "Student Name,Date,Status,Scan Time\n";
    const rows = records.map((r: any) =>
        `${r.studentName},${r.date},${r.status},${r.scannedAt ? r.scannedAt.toISOString() : "N/A"}`
    ).join("\n");

    return header + rows;
}
