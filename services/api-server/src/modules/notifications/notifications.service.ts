import Queue from "bull";
import { notificationsRepository } from "./notifications.repository";
import { usersRepository } from "../users/users.repository";
import { classesService } from "../classes/classes.service";
import {
    sendNotificationEmail,
    sendParentInvitationEmail,
} from "../../infrastructure/email/emailService";

// ──────────────────────────────────────────────────────────────────────────────
// Bull email queue — backed by Redis when available, skips if not.
// Upstash requires tls:{} when using rediss:// URLs.
// ──────────────────────────────────────────────────────────────────────────────
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isTLS = redisUrl.startsWith("rediss://");

let emailQueue: Queue.Queue | null = null;
try {
    emailQueue = new Queue("email-notifications", redisUrl, {
        redis: {
            maxRetriesPerRequest: null,
            ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
        }
    });

    emailQueue.process(async (job) => {
        const { to, subject, html, text } = job.data;
        const { sendEmail } = await import("../../infrastructure/email/emailService");
        await sendEmail(to, subject, html, text);
    });

    emailQueue.on("failed", (job, err) => {
        console.error(`[Email Queue] Job ${job.id} failed:`, err.message);
    });

    console.log(`[Email Queue] Bull queue ready${isTLS ? " (TLS)" : ""}.`);
} catch (err: any) {
    console.warn(
        "[Email Queue] Could not initialise Bull queue:",
        err.message,
        "— emails will be sent synchronously."
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Internal queue helper
// ──────────────────────────────────────────────────────────────────────────────
async function queueEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
    attempts = 3
) {
    if (emailQueue) {
        emailQueue.add({ to, subject, html, text }, { attempts, backoff: 5000 });
        return;
    }
    // No queue: fire-and-forget synchronous send
    const { sendEmail } = await import("../../infrastructure/email/emailService");
    sendEmail(to, subject, html, text).catch((err: Error) =>
        console.error("[Email] Sync send failed:", err.message)
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Notification Service
// ──────────────────────────────────────────────────────────────────────────────
export const notificationService = {
    async notify(
        userId: string,
        type: string,
        title: string,
        content: string,
        link?: string
    ) {
        const prefs = await notificationsRepository.getNotificationPreferences(userId);
        const userPrefs = prefs?.preferences || {
            newPost: { inApp: true, email: false, push: false },
            newComment: { inApp: true, email: false, push: false },
            assignmentCreated: { inApp: true, email: true, push: false },
            gradePublished: { inApp: true, email: true, push: false },
            attendanceMarked: { inApp: true, email: false, push: false },
        };

        const category = this.getCategoryFromType(type);
        const pref = (userPrefs as Record<string, any>)[category] || { inApp: true, email: false };

        // 1. In-app notification
        if (pref.inApp) {
            await notificationsRepository.createNotification(
                userId,
                type,
                `${title}: ${content}`,
                link
            );
        }

        // 2. Email
        if (pref.email) {
            const user = await usersRepository.getUser(userId);
            if (user?.email) {
                // Build HTML via emailService helper, then queue it
                const appUrl = process.env.APP_URL || "http://localhost:5000";
                const actionUrl = link
                    ? link.startsWith("http") ? link : `${appUrl}${link}`
                    : undefined;

                const html = buildNotificationHtml(title, content, actionUrl);
                await queueEmail(user.email, title, html, content);
            }
        }
    },

    async sendInvitationEmail(
        email: string,
        studentName: string,
        token: string
    ) {
        await sendParentInvitationEmail(email, studentName, token);
    },

    getCategoryFromType(type: string): string {
        if (type.includes("assignment")) return "assignmentCreated";
        if (type.includes("grade")) return "gradePublished";
        if (type.includes("post")) return "newPost";
        if (type.includes("comment")) return "newComment";
        if (type.includes("attendance")) return "attendanceMarked";
        return "newPost";
    },

    async notifyClass(
        classId: string,
        type: string,
        title: string,
        content: string,
        link?: string
    ) {
        const students = await classesService.getClassRoster(classId);
        for (const student of students) {
            if (student.role === "student") {
                await this.notify(student.id, type, title, content, link);
            }
        }
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// HTML template helper (kept local to avoid circular imports with emailService)
// ──────────────────────────────────────────────────────────────────────────────
function buildNotificationHtml(title: string, body: string, actionUrl?: string) {
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
  <h2 style="color:#6d28d9;margin-top:0;">${title}</h2>
  <p style="color:#374151;">${body}</p>
  ${actionUrl
            ? `<a href="${actionUrl}" style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px;font-weight:600;">View in Classroom</a>`
            : ""}
  <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
  <p style="font-size:12px;color:#9ca3af;">You received this because you have email notifications enabled on EduSphere Classroom.</p>
</div>`;
}
