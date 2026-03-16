import { Request, Response, NextFunction } from "express";
import { analyticsRepository } from "./analytics.repository";

export class AnalyticsController {
    async getEngagementHeatmap(req: Request, res: Response, next: NextFunction) {
        try {
            const heatmap = await analyticsRepository.getEngagementHeatmap(req.params.classId as string);
            res.json(heatmap);
        } catch (error) {
            next(error);
        }
    }

    async getAssignmentStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await analyticsRepository.getAssignmentStats(req.params.assignmentId as string);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

export const analyticsController = new AnalyticsController();
