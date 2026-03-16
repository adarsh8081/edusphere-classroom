import { parentsRepository } from "./parents.repository";
import { getStudentReport } from "./parents.service";
import { sendEmail } from "../../infrastructure/email/emailService";

export async function generateWeeklyDigests() {
    console.log("[WeeklyDigest] Starting generation...");

    // 1. Find all parent-student links
    const links = await parentsRepository.getParentStudentLinks();

    let count = 0;
    for (const link of links) {
        try {
            const parent = await parentsRepository.getUserById(link.parentId);
            const student = await parentsRepository.getUserById(link.studentId);

            if (!parent || !student) continue;

            const report = await getStudentReport(student.id);

            const html = `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
                    <h2 style="color:#6d28d9;">Weekly Progress Report</h2>
                    <p>Hello ${parent.name}, here is the weekly update for <strong>${student.name}</strong>.</p>
                    
                    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
                        <h3 style="margin-top:0;">Summary</h3>
                        <p>Attendance Rate: <strong>${report.attendanceRate}%</strong></p>
                        <p>Average Grade: <strong>${report.averageGrade}%</strong></p>
                    </div>

                    <h3>Recent Activity</h3>
                    <ul style="padding-left:20px;">
                        ${report.recentSubmissions.map((s: any) => `
                            <li>${s.assignmentTitle}: <strong>${s.grade || 'Pending'}</strong></li>
                        `).join('')}
                    </ul>

                    <p style="margin-top:24px;color:#9ca3af;font-size:12px;">
                        View full details in the <a href="${process.env.APP_URL || 'http://localhost:5000'}/parent">Parent Portal</a>.
                    </p>
                </div>
            `;

            await sendEmail(parent.email, `Weekly Progress Report: ${student.name}`, html);
            count++;
        } catch (err) {
            console.error(`[WeeklyDigest] Failed for link ${link.id}:`, err);
        }
    }

    console.log(`[WeeklyDigest] Finished. Sent ${count} reports.`);
    return count;
}
