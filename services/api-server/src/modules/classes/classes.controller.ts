import { Request, Response, NextFunction } from "express";
import { classesService } from "./classes.service";

export class ClassesController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const classes = await classesService.getClassesForUser(user.id, user.role);
            res.json(classes);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const newClass = await classesService.createClass(req.body, user.id);
            res.status(201).json(newClass);
        } catch (error) {
            next(error);
        }
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const cls = await classesService.getClass(req.params.classId as string);
            if (!cls) return res.status(404).json({ message: "Class not found" });
            res.json(cls);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const updatedClass = await classesService.updateClass(req.params.classId as string, user.id, req.body);
            if (!updatedClass) return res.status(404).json({ message: "Class not found or unauthorized" });
            res.json(updatedClass);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const success = await classesService.deleteClass(req.params.classId as string, user.id);
            if (!success) return res.status(404).json({ message: "Class not found or unauthorized" });
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    async join(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { classCode } = req.body;
            await classesService.joinClass(classCode, user.id);
            res.status(201).json({ message: "Joined successfully" });
        } catch (error: any) {
            if (error.message === "Invalid class code") return res.status(404).json({ message: error.message });
            next(error);
        }
    }

    async roster(req: Request, res: Response, next: NextFunction) {
        try {
            const roster = await classesService.getClassRoster(req.params.classId as string);
            res.json(roster);
        } catch (error) {
            next(error);
        }
    }

    async mySubmissions(req: Request, res: Response, next: NextFunction) {
        try {
            res.json([]);
        } catch (error) {
            next(error);
        }
    }
}

export const classesController = new ClassesController();
