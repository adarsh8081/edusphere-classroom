import { storage } from "../storage";
import { notificationService } from "../notification-service";

export class RiskService {
    static async calculateStudentRisk(studentId: string, classId: string): Promise<number> {
        try {
            // 1. Attendance Risk
            const attendance = await storage.getStudentAttendance(studentId, classId);
            const attendanceRate = attendance.length > 0
                ? attendance.filter(a => a.status === 'present').length / attendance.length
                : 1;
            const attendanceRisk = (1 - attendanceRate) * 40; // Max 40 points

            // 2. Assignment Risk (Missing)
            const submissions = await storage.getStudentSubmissions(studentId, classId);
            const assignments = await storage.getAssignments(classId);
            const missingCount = assignments.length - submissions.length;
            const missingRate = assignments.length > 0 ? missingCount / assignments.length : 0;
            const assignmentRisk = missingRate * 40; // Max 40 points

            // 3. Grade Risk
            const gradedSubmissions = submissions.filter(s => s.grade !== null);
            const avgGrade = gradedSubmissions.length > 0
                ? gradedSubmissions.reduce((sum, s) => sum + Number(s.grade), 0) / gradedSubmissions.length
                : 80;
            const gradeRisk = avgGrade < 60 ? 20 : (Math.max(0, 80 - avgGrade) / 20) * 20; // Max 20 points

            const totalRisk = Math.min(100, attendanceRisk + assignmentRisk + gradeRisk);

            // Determine factors
            const factors = [];
            if (attendanceRate < 0.8) factors.push(`Low attendance (${(attendanceRate * 100).toFixed(0)}%)`);
            if (missingCount > 0) factors.push(`${missingCount} missing assignments`);
            if (avgGrade < 70) factors.push(`Average grade is low (${avgGrade.toFixed(1)})`);

            // Update DB
            await storage.updateStudentRisk(studentId, classId, totalRisk, factors);

            // Notify teacher if high risk (> 70)
            if (totalRisk > 70) {
                const student = await storage.getUser(studentId);
                const classData = await storage.getClass(classId);
                const teachers = await storage.getClassRoster(classId);

                for (const teacher of teachers) {
                    if (teacher.role === 'teacher') {
                        await notificationService.notify(teacher.id, 'student_risk_alert',
                            'High Risk Alert',
                            `${student?.name} in ${classData?.name} has reached a high risk score of ${totalRisk.toFixed(0)}%`,
                            `/class/${classId}/analytics/student/${studentId}`
                        );
                    }
                }
            }

            return totalRisk;
        } catch (error) {
            console.error(`Error calculating risk for ${studentId}:`, error);
            return 0;
        }
    }

    static async runClassRiskAssessment(classId: string): Promise<void> {
        const roster = await storage.getClassRoster(classId);
        for (const member of roster) {
            if (member.role === 'student') {
                await this.calculateStudentRisk(member.id, classId);
            }
        }
    }
}
