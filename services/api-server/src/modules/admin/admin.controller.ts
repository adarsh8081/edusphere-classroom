import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { AnalyticsService } from "../analytics/analytics.service";

export class AdminController {
    async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password, role } = req.body;
            // The route middleware handled Zod validation, but if we need a quick check:
            if (!name || !email || !password || !role) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            const newUser = await adminService.createUser({ name, email, password, role });
            const { password: _, ...userSafe } = newUser;
            res.status(201).json(userSafe);
        } catch (err: any) {
            console.error("[AdminUserCreate] Error:", err.message);
            if (err.message === "Email already exists") {
                return res.status(409).json({ message: err.message });
            }
            next(err);
        }
    }

    async promoteSelf(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
            const user = req.user!;
            const updated = await adminService.promoteSelf(user.id);
            res.json({ message: "You are now a super_admin!", user: updated });
        } catch (err) {
            next(err);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await adminService.getStats();
            res.json(stats);
        } catch (err) {
            next(err);
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const role = req.query.role as string | undefined;
            const search = req.query.search as string | undefined;
            const users = await adminService.getAllUsers(role, search);
            res.json(users);
        } catch (err) {
            next(err);
        }
    }

    async updateUserRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { role } = req.body;
            if (!["student", "teacher", "parent", "super_admin"].includes(role)) {
                return res.status(400).json({ message: "Invalid role" });
            }
            const updated = await adminService.updateUserRole(req.params.id as string, role);
            res.json(updated);
        } catch (err) {
            next(err);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req.user!;
            await adminService.deleteUser(req.params.id as string, currentUser.id);
            res.json({ success: true });
        } catch (err: any) {
            if (err.message === "Cannot delete your own account") return res.status(400).json({ message: err.message });
            next(err);
        }
    }

    async getClasses(req: Request, res: Response, next: NextFunction) {
        try {
            const classes = await adminService.getAllClasses();
            res.json(classes);
        } catch (err) {
            next(err);
        }
    }

    async deleteClass(req: Request, res: Response, next: NextFunction) {
        try {
            await adminService.deleteClass(req.params.id as string);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }

    async getActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const activity = await adminService.getRecentActivity(limit);
            res.json(activity);
        } catch (err) {
            next(err);
        }
    }

    async getFlaggedWellbeing(req: Request, res: Response, next: NextFunction) {
        try {
            const flagged = await adminService.getFlaggedWellbeing();
            res.json(flagged);
        } catch (err) {
            next(err);
        }
    }

    async getInstitutionalStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await AnalyticsService.getInstitutionalStats();
            res.json(stats);
        } catch (err: any) {
            next(err);
        }
    }

    async triggerWeeklyDigest(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.isAuthenticated() || req.user!.role !== "teacher") {
                return res.status(403).json({ message: "Only teachers can trigger digests" });
            }
            const { generateWeeklyDigests } = await import("../parents/weeklyDigest.service");
            const count = await generateWeeklyDigests();
            res.json({ message: `Sent ${count} digests successfully.` });
        } catch (err: any) {
            next(err);
        }
    }
}

export const adminController = new AdminController();
