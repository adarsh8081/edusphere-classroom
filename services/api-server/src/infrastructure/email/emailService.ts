/**
 * emailService.ts — Standalone email delivery module.
 *
 * Uses Resend when RESEND_API_KEY is configured.
 * Falls back to a Nodemailer/Ethereal console-mock for local development.
 *
 * Usage:
 *   import { sendEmail } from "./emailService";
 *   await sendEmail("user@example.com", "Hello!", "<p>Hi there</p>");
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";

// ──────────────────────────────────────────────────────────────────────────────
// Provider setup
// ──────────────────────────────────────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_ADDRESS =
    process.env.EMAIL_FROM || "EduSphere Classroom <noreply@edusphere.edu>";

const nodemailerTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER || "mock@edusphere.edu",
        pass: process.env.SMTP_PASS || "mockpass",
    },
});

if (resend) {
    console.log("[Email] Provider: Resend — FROM:", FROM_ADDRESS);
} else {
    console.log(
        "[Email] No RESEND_API_KEY — using console mock (safe for development)."
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Send an email via Resend (production) or Nodemailer mock (development).
 *
 * @param to      Recipient email address
 * @param subject Email subject line
 * @param html    HTML body of the email
 * @param text    Optional plain-text fallback (auto-stripped from HTML if omitted)
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
): Promise<void> {
    const textBody = text || html.replace(/<[^>]*>/g, "").trim();

    if (resend) {
        const { error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject,
            html,
            text: textBody,
        });
        if (error) {
            throw new Error(`[Email] Resend error: ${error.message}`);
        }
        return;
    }

    // Development mock — log to console and attempt Ethereal delivery (optional)
    console.log(`\n[Email Mock] ──────────────────────────────`);
    console.log(`  TO:      ${to}`);
    console.log(`  SUBJECT: ${subject}`);
    console.log(`  BODY:    ${textBody.substring(0, 120)}…`);
    console.log(`────────────────────────────────────────────\n`);

    try {
        await nodemailerTransport.sendMail({
            from: FROM_ADDRESS,
            to,
            subject,
            text: textBody,
            html,
        });
    } catch {
        // Ethereal/mock transport may reject — suppress in dev; log only.
        console.warn("[Email Mock] Nodemailer transport suppressed (expected in dev).");
    }
}

/**
 * Render and send the standard EduSphere notification email.
 */
export async function sendNotificationEmail(
    to: string,
    title: string,
    body: string,
    actionUrl?: string
): Promise<void> {
    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
  <h2 style="color:#6d28d9;margin-top:0;">${title}</h2>
  <p style="color:#374151;">${body}</p>
  ${actionUrl
            ? `<a href="${actionUrl}"
             style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;
                    text-decoration:none;border-radius:6px;margin-top:12px;font-weight:600;">
            View in Classroom
           </a>`
            : ""
        }
  <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
  <p style="font-size:12px;color:#9ca3af;">
    You received this because you have email notifications enabled on EduSphere Classroom.
  </p>
</div>`;

    await sendEmail(to, title, html, body);
}

/**
 * Render and send the parent invitation email.
 */
export async function sendParentInvitationEmail(
    to: string,
    studentName: string,
    token: string
): Promise<void> {
    const appUrl = process.env.APP_URL || "http://localhost:5000";
    const inviteLink = `${appUrl}/parent/register?token=${token}`;
    const subject = "Invitation to join EduSphere Classroom";
    const body = `You have been invited to monitor the progress of ${studentName} on EduSphere Classroom.`;
    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
  <h2 style="color:#6d28d9;margin-top:0;">Parent Invitation</h2>
  <p style="color:#374151;">${body}</p>
  <p style="color:#374151;">Click the button below to register and link your account.</p>
  <a href="${inviteLink}"
     style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;
            text-decoration:none;border-radius:6px;margin-top:12px;font-weight:600;">
    Register as Parent
  </a>
  <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
  <p style="font-size:12px;color:#9ca3af;">
    If you didn't expect this invitation, you can safely ignore this email.
  </p>
</div>`;

    await sendEmail(to, subject, html, body);
}
