import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";
import { getUploadedFileUrl, getPresignedUploadUrl } from "../../infrastructure/storage/fileUploadService";

export class UsersController {
    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req.user!;
            const results = await usersService.searchUsers(req.query.q as string, currentUser.id, currentUser.role);
            res.json(results);
        } catch (err) {
            next(err);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const profile = await usersService.getProfile(req.user!.id);
            if (!profile) return res.status(404).json({ message: "User not found" });
            res.json(profile);
        } catch (err) {
            next(err);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, bio, skills, avatarUrl } = req.body;
            const updated = await usersService.updateProfile(req.user!.id, { name, bio, skills, avatarUrl });
            res.json(updated);
        } catch (err) {
            console.error("[Profile] Update error:", err);
            next(err);
        }
    }

    async uploadFile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) return res.status(400).json({ message: "No file provided. Use field name 'file'." });
            const url = getUploadedFileUrl(req.file as any);
            res.json({ url });
        } catch (err: any) {
            console.error("[Upload] Error:", err.message);
            next(err);
        }
    }

    async presignUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const { filename, mimeType } = req.body;
            if (!filename || !mimeType) return res.status(400).json({ message: "filename and mimeType are required" });
            const result = await getPresignedUploadUrl(filename, mimeType);
            if (!result) {
                return res.status(503).json({ message: "S3 not configured. Use /api/upload for server-side uploads." });
            }
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async uploadAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) return res.status(400).json({ message: "No file provided. Use field name 'avatar'." });
            const url = getUploadedFileUrl(req.file as any);
            res.json({ url });
        } catch (err: any) {
            next(err);
        }
    }
}

export const usersController = new UsersController();
