import Queue from "bull";
import { storage } from "./storage";
import nodemailer from "nodemailer";

// Simple email transport setup (using ethereal for testing or placeholders)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const emailQueue = new Queue("email", process.env.REDIS_URL || "redis://127.0.0.1:6379");
export const postQueue = new Queue("posts", process.env.REDIS_URL || "redis://127.0.0.1:6379");

emailQueue.process(async (job) => {
    const { to, subject, text } = job.data;
    console.log(`Sending email to ${to}: ${subject}`);
    try {
        await transporter.sendMail({
            from: '"EduSphere" <no-reply@edusphere.com>',
            to,
            subject,
            text,
        });
    } catch (err) {
        console.error(`Failed to send email to ${to}:`, err);
        throw err;
    }
});

postQueue.process(async (job) => {
    const { postId } = job.data;
    console.log(`Publishing scheduled post: ${postId}`);
    // In a real app, this might flip a 'published' flag or trigger a notification
    // For now, we'll just log it. The logic to filter scheduled posts from public view 
    // would be in storage.getPosts.
});

// We'll keep track of posts we have already notified about in memory to avoid repeating notifications
const notifiedPosts = new Set<string>();

// Periodic job to check for scheduled posts and deadlines
export function setupJobs() {
    console.log("Setting up background jobs...");

    setInterval(async () => {
        try {
            // 1. Peer Review Assignments
            const { db } = await import('./db');
            const { assignments } = await import('@shared/schema');
            const { eq, and, lte, isNotNull } = await import('drizzle-orm');

            // Find assignments where isPeerReview is true, reviewDeadline has passed, and we need to assign
            const pendingReviews = await db.select().from(assignments).where(
                and(
                    eq(assignments.isPeerReview, true),
                    isNotNull(assignments.reviewDeadline),
                    lte(assignments.reviewDeadline, new Date())
                )
            );

            for (const assignment of pendingReviews) {
                await storage.assignPeerReviews(assignment.id);
            }

            // 2. We could also notify about scheduled posts that just became active
            // Because our getPosts filters they automatically appear, but we need to notify
            const { posts } = await import('@shared/schema');
            const recentScheduledPosts = await db.select().from(posts).where(
                and(
                    isNotNull(posts.scheduledAt),
                    lte(posts.scheduledAt, new Date())
                )
            );

            for (const post of recentScheduledPosts) {
                if (!notifiedPosts.has(post.id)) {
                    notifiedPosts.add(post.id);
                    const { notificationService } = await import("./notification-service");
                    await notificationService.notifyClass(post.classId, 'announcement', `Scheduled post now live!`, post.content, `/class/${post.classId}`);
                }
            }

            // 3. Wellbeing anomaly detection: notify teacher if a student had 3+ low mood days recently
            const { wellbeingCheckins } = await import('@shared/schema');
            const { gte } = await import('drizzle-orm');
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const recentLowMoods = await db.select().from(wellbeingCheckins).where(
                and(
                    lte(wellbeingCheckins.moodScore, 2),
                    gte(wellbeingCheckins.createdAt, threeDaysAgo)
                )
            );
            // Group by student+class
            const byStudent: Record<string, { classId: string; count: number }> = {};
            for (const c of recentLowMoods) {
                const k = `${c.studentId}:${c.classId}`;
                if (!byStudent[k]) byStudent[k] = { classId: c.classId, count: 0 };
                byStudent[k].count++;
            }
            for (const [key, info] of Object.entries(byStudent)) {
                if (info.count >= 3) {
                    const cls = await storage.getClass(info.classId);
                    if (cls) {
                        await storage.createNotification({
                            userId: cls.teacherId,
                            type: 'wellbeing_alert',
                            title: '⚠️ Well-being Pattern Detected',
                            message: `A student in ${cls.name} has logged low mood 3+ times in the last 3 days. Consider reaching out.`,
                            link: `/class/${info.classId}`,
                            isRead: false,
                        });
                    }
                }
            }

            // 3. AI Recommendations processing could also run here (e.g. daily cron)

        } catch (e) {
            console.error("Job interval error: ", e);
        }
    }, 60000); // Run every minute
}
