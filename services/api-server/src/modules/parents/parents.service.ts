import { parentsRepository } from "./parents.repository";
import crypto from "crypto";
import { sendParentInvitationEmail } from "../../infrastructure/email/emailService";

export async function inviteParent(studentId: string, parentEmail: string) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Check if student exists
    const student = await parentsRepository.getStudentById(studentId);
    if (!student) throw new Error("Student not found");

    // Create invitation
    const invitation = await parentsRepository.createParentInvitation(studentId, parentEmail, token, expiresAt);

    // Send email
    await sendParentInvitationEmail(parentEmail, student.name, token);

    return invitation;
}

export async function getStudentReport(studentId: string) {
    // 1. Attendance stats
    const attendanceRecords = await parentsRepository.getAttendanceForStudent(studentId);
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // 2. Grade stats
    const studentSubmissions = await parentsRepository.getSubmissionsForStudent(studentId);
    const gradedSubmissions = studentSubmissions.filter((s: any) => s.grade !== null);
    const averageGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((acc: number, s: any) => acc + Number(s.grade || 0), 0) / gradedSubmissions.length)
        : 0;

    // 3. Recent activity
    const recentSubmissions = await parentsRepository.getRecentSubmissionsForStudent(studentId);

    return {
        attendanceRate,
        averageGrade,
        recentSubmissions,
        totalAttendance: totalDays,
        presentCount: presentDays
    };
}

export async function getLinkedStudents(parentId: string) {
    const links = await parentsRepository.getLinkedStudentsWithDetails(parentId);

    const studentsWithReports = await Promise.all(links.map(async (s) => {
        const report = await getStudentReport(s.studentId);
        return { ...s, report };
    }));

    return studentsWithReports;
}

export async function registerParent(token: string, name: string, passwordHash: string) {
    const invitation = await parentsRepository.getPendingInvitation(token);

    if (!invitation || invitation.expiresAt < new Date()) {
        throw new Error("Invalid or expired invitation token");
    }

    // 1. Create parent user
    const parent = await parentsRepository.createParentUser(invitation.parentEmail, name, passwordHash);

    // 2. Link to student
    await parentsRepository.linkParentToStudent(parent.id, invitation.studentId);

    // 3. Mark invitation as accepted
    await parentsRepository.updateParentInvitationStatus(invitation.id, "accepted");

    return parent;
}

export async function sendParentMessage(senderId: string, receiverId: string, studentId: string, content: string) {
    const sender = await parentsRepository.getUserById(senderId);
    const receiver = await parentsRepository.getUserById(receiverId);

    if (!sender || !receiver) throw new Error("User not found");

    let parentId, teacherId;
    if (sender.role === 'parent') {
        parentId = senderId;
        teacherId = receiverId;
    } else {
        parentId = receiverId;
        teacherId = senderId;
    }

    const message = await parentsRepository.insertParentMessage(parentId, teacherId, studentId, content, senderId);
    return message;
}

export async function getParentMessages(parentId: string, teacherId: string, studentId: string) {
    return await parentsRepository.fetchParentMessages(parentId, teacherId, studentId);
}
