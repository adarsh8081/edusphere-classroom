import { Request, Response, NextFunction } from "express";
import { wellbeingRepository } from "./wellbeing.repository";
import { classesService } from "../classes/classes.service";
import { notificationsRepository } from "../notifications/notifications.repository";
import { AIService } from "../ai/ai.service";
import { WellbeingService } from "./wellbeing.service";
import { notificationService } from "../notifications/notifications.service";
import { api } from "@edusphere/api-client";
import { db } from "../../core/database/db";
import { wellbeingCheckins } from "@edusphere/types";
import { eq } from "drizzle-orm";

export class WellbeingController {
    async checkinLegacy(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const { classId, moodScore, notes } = req.body;
            if (!classId || moodScore == null) return res.status(400).json({ message: "classId and moodScore are required" });
            let aiSentimentScore: number | undefined;
            let isFlagged = false;
            if (notes) {
                const sentiment = await AIService.analyzeSentiment(notes);
                aiSentimentScore = Math.round((sentiment?.score ?? 0.5) * 100);
                isFlagged = aiSentimentScore < 25;
            }
            if (moodScore === 1) isFlagged = true;

            const checkin = await wellbeingRepository.createWellbeingCheckin({
                studentId: user.id, classId, moodScore, notes, aiSentimentScore, isFlagged,
            });

            if (isFlagged) {
                const cls = await classesService.getClass(classId);
                if (cls) {
                    await notificationsRepository.createNotification(
                        cls.teacherId,
                        "wellbeing_alert",
                        `Student Well-being Alert: A student may need support in ${cls.name}. Review the well-being dashboard.`,
                        `/class/${classId}`
                    );
                }
            }
            res.status(201).json(checkin);
        } catch (err) {
            console.error(err);
            next(err);
        }
    }

    async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const checkins = await wellbeingRepository.getWellbeingAnalytics(req.params.classId as string);
            const flagged = checkins.filter((c: any) => c.isFlagged);
            const moodByDay: Record<string, number[]> = {};
            checkins.forEach((c: any) => {
                const day = new Date(c.createdAt).toISOString().split("T")[0];
                if (!moodByDay[day]) moodByDay[day] = [];
                moodByDay[day].push(c.moodScore);
            });
            const trends = Object.entries(moodByDay).map(([date, scores]) => ({
                date,
                avgMood: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
                count: scores.length,
            }));
            res.json({ trends, flagged, totalCheckins: checkins.length });
        } catch (err) {
            next(err);
        }
    }

    async checkin(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body; // Validation handled by middleware
            const checkin = await wellbeingRepository.createWellbeingCheckin({ ...data, studentId: req.user!.id });
            WellbeingService.analyzeTrends(req.user!.id).then(async (analysisResult) => {
                await wellbeingRepository.updateCheckinFlag(
                    checkin.id,
                    analysisResult.isFlagged,
                    analysisResult.isFlagged ? -1 : 1
                );

                if (analysisResult.isFlagged) {
                    const classRoster = await classesService.getClassRoster(data.classId);
                    const teachers = classRoster.filter(u => u.role === "teacher");
                    for (const teacher of teachers) {
                        await notificationService.notify(teacher.id, "wellbeing_flagged",
                            "Student Wellbeing Alert",
                            `A student in your class has been flagged by AI for concerning emotional trends: ${req.user!.name}`,
                            `/class/${data.classId}/wellbeing`
                        );
                    }
                }
            }).catch(err => console.error("[Wellbeing AI] Error:", err));
            res.status(201).json(checkin);
        } catch (err: any) {
            if (err.message) return res.status(400).json({ message: err.message });
            next(err);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await wellbeingRepository.getWellbeingAnalytics(req.params.classId as string);
            res.json(stats);
        } catch (err) {
            next(err);
        }
    }

    async runRiskAssessment(req: Request, res: Response, next: NextFunction) {
        try {
            const { RiskService } = await import("../analytics/risk.service");
            await RiskService.runClassRiskAssessment(req.params.classId as string);
            res.json({ message: "Risk assessment completed" });
        } catch (err) {
            next(err);
        }
    }

    async getAtRiskStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const students = await wellbeingRepository.getAtRiskStudents(req.params.classId as string);
            res.json(students);
        } catch (err) {
            next(err);
        }
    }
}

export const wellbeingController = new WellbeingController();
