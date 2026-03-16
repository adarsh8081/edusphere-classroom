import { Request, Response, NextFunction } from "express";
import { parentsRepository } from "./parents.repository";
import { inviteParent, registerParent, getLinkedStudents, sendParentMessage, getParentMessages, getStudentReport } from "./parents.service";
import crypto from "crypto";
import { promisify } from "util";
import { db } from "../../core/database/db";
import { parentInvitations, users } from "@edusphere/types";
import { eq } from "drizzle-orm";

export class ParentsController {
    async invite(req: Request, res: Response, next: NextFunction) {
        try {
            const { studentId, parentEmail } = req.body;
            if (!studentId || !parentEmail) return res.status(400).json({ message: "studentId and parentEmail required" });
            const invitation = await inviteParent(studentId, parentEmail);
            res.status(201).json(invitation);
        } catch (err: any) {
            if (err.message) return res.status(400).json({ message: err.message });
            next(err);
        }
    }

    async verifyInvitation(req: Request, res: Response, next: NextFunction) {
        try {
            const [invitation] = await db
                .select({
                    id: parentInvitations.id,
                    email: parentInvitations.parentEmail,
                    studentId: parentInvitations.studentId,
                    studentName: users.name,
                    status: parentInvitations.status,
                    expiresAt: parentInvitations.expiresAt,
                })
                .from(parentInvitations)
                .innerJoin(users, eq(parentInvitations.studentId, users.id))
                .where(eq(parentInvitations.token, req.params.token as string))
                .limit(1);

            if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
                return res.status(404).json({ message: "Invalid or expired invitation" });
            }
            res.json(invitation);
        } catch (err) {
            next(err);
        }
    }

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, name, password } = req.body;
            if (!token || !name || !password) return res.status(400).json({ message: "token, name, password required" });
            const scryptAsync = promisify(crypto.scrypt);
            const salt = crypto.randomBytes(16).toString("hex");
            const buf = (await scryptAsync(password, salt, 64)) as Buffer;
            const hashedPassword = `${buf.toString("hex")}.${salt}`;
            const parent = await registerParent(token, name, hashedPassword);
            req.login(parent, (err) => {
                if (err) return next(err);
                res.status(201).json(parent);
            });
        } catch (err: any) {
            if (err.message) return res.status(400).json({ message: err.message });
            next(err);
        }
    }

    async dashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            if (user.role !== "parent") return res.status(403).json({ message: "Only parents can access this" });
            const students = await getLinkedStudents(user.id);
            res.json(students);
        } catch (err) {
            next(err);
        }
    }

    async sendMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { receiverId, studentId, content } = req.body;
            const message = await sendParentMessage(user.id, receiverId, studentId, content);
            res.status(201).json(message);
        } catch (err: any) {
            if (err.message) return res.status(400).json({ message: err.message });
            next(err);
        }
    }

    async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const messages = await getParentMessages(req.params.parentId as string, req.params.teacherId as string, req.params.studentId as string);
            res.json(messages);
        } catch (err) {
            next(err);
        }
    }

    async getChildren(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            if (user.role !== "parent") return res.status(403).json({ message: "Only parents can view this" });
            const children = await parentsRepository.getLinkedChildren(user.id);
            res.json(children);
        } catch (err) {
            next(err);
        }
    }

    async getChildDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            if (user.role !== "parent") return res.status(403).json({ message: "Forbidden" });
            const dashboard = await getStudentReport(req.params.studentId as string);
            res.json(dashboard);
        } catch (err) {
            next(err);
        }
    }

    async link(req: Request, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== "parent") return res.sendStatus(403);
            const { token } = req.body;
            const invitation = await parentsRepository.getParentInvitation(token);
            if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
                return res.status(400).send("Invalid or expired invitation");
            }
            await parentsRepository.linkParentToStudent(req.user!.id, invitation.studentId);
            await parentsRepository.updateParentInvitationStatus(invitation.id, "accepted");
            res.json({ message: "Student linked successfully" });
        } catch (err) {
            next(err);
        }
    }
}

export const parentsController = new ParentsController();
