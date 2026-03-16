import { Request, Response, NextFunction } from "express";
import { getUserGamificationProfile, getClassLeaderboard, getBadges, awardXP, updateStreak } from "./gamification.service";

export class GamificationController {
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const [profile, streak] = await Promise.all([
                getUserGamificationProfile(user.id),
                updateStreak(user.id),
            ]);
            res.json({ ...profile, streak });
        } catch (err: any) {
            console.error("[Gamification] GET /me error:", err.message);
            next(err);
        }
    }

    async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            const leaderboard = await getClassLeaderboard(req.params.classId as string);
            res.json(leaderboard);
        } catch (err: any) {
            console.error("[Gamification] leaderboard error:", err.message);
            next(err);
        }
    }

    async getBadges(req: Request, res: Response, next: NextFunction) {
        try {
            const allBadges = await getBadges();
            res.json(allBadges);
        } catch (err: any) {
            next(err);
        }
    }

    async awardManualXp(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, amount, reason, classId } = req.body;
            if (!userId || !amount || !reason) return res.status(400).json({ message: "userId, amount, reason required" });
            const result = await awardXP(userId, amount, reason, classId);
            res.json(result);
        } catch (err: any) {
            next(err);
        }
    }
}

export const gamificationController = new GamificationController();
