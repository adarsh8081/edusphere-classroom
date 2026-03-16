import { Request, Response, NextFunction } from "express";
import { api } from "@edusphere/api-client";
import { assignmentsRepository } from "./assignments.repository";
import { notificationService } from "../notifications/notifications.service";
import { PlagiarismService } from "./plagiarism.service";

export class AssignmentsController {
    async listAssignments(req: Request, res: Response, next: NextFunction) {
        try {
            const list = await assignmentsRepository.getAssignments(req.params.classId as string);
            res.json(list);
        } catch (error) {
            next(error);
        }
    }

    async getAssignment(req: Request, res: Response, next: NextFunction) {
        try {
            const a = await assignmentsRepository.getAssignment(req.params.assignmentId as string);
            if (!a) return res.status(404).json({ message: "Not found" });
            res.json(a);
        } catch (error) {
            next(error);
        }
    }

    async createAssignment(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const input = req.body; // Validation handled by middleware
            const assignment = await assignmentsRepository.createAssignment({
                ...input,
                classId: req.params.classId as string,
                createdBy: user.id,
                dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
                reviewDeadline: input.reviewDeadline ? new Date(input.reviewDeadline) : undefined,
            });

            if (input.prerequisites && input.prerequisites.length > 0) {
                for (const preId of input.prerequisites) {
                    await assignmentsRepository.addPrerequisite(preId, "assignment", assignment.id, "assignment");
                }
            }
            await assignmentsRepository.logActivity(user.id, req.params.classId as string, "created_assignment", assignment.id);
            await notificationService.notifyClass(
                req.params.classId as string, "assignment_created", "New Assignment",
                `${assignment.title} has been posted.`, `/class/${req.params.classId as string}`
            );
            res.status(201).json(assignment);
        } catch (error) {
            next(error);
        }
    }

    async listSubmissions(req: Request, res: Response, next: NextFunction) {
        try {
            const subs = await assignmentsRepository.getSubmissions(req.params.assignmentId as string);
            res.json(subs);
        } catch (error) {
            next(error);
        }
    }

    async createSubmission(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const input = req.body;
            const sub = await assignmentsRepository.createSubmission({
                ...input,
                assignmentId: req.params.assignmentId as string,
                studentId: user.id,
            });
            res.status(201).json(sub);
        } catch (error) {
            next(error);
        }
    }

    async gradeSubmission(req: Request, res: Response, next: NextFunction) {
        try {
            const { grade, feedback } = req.body;
            const sub = await assignmentsRepository.gradeSubmission(req.params.submissionId as string, String(grade), feedback);
            await notificationService.notify(
                sub.studentId, "grade_published", "Work Graded",
                `Your submission has been graded: ${grade}`, `/class/${sub.assignmentId}`
            );
            res.json(sub);
        } catch (error) {
            next(error);
        }
    }

    async checkPlagiarism(req: Request, res: Response, next: NextFunction) {
        try {
            const submission = await assignmentsRepository.getSubmission(req.params.submissionId as string);
            if (!submission) return res.status(404).json({ message: "Submission not found" });
            const content = submission.content || "";
            const report = await PlagiarismService.checkOriginality(content);
            await assignmentsRepository.updateSubmissionPlagiarism(submission.id, report.similarityScore, report);
            const updatedSubmission = await assignmentsRepository.getSubmission(submission.id);
            res.json(updatedSubmission);
        } catch (error) {
            next(error);
        }
    }

    async getReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const revs = await assignmentsRepository.getReviewsForAssignment(req.params.id as string);
            res.json(revs);
        } catch (error) {
            next(error);
        }
    }

    async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const { score, isFlagged } = req.body;
            const updated = await assignmentsRepository.updateReviewModeration(req.params.id as string, score, isFlagged, req.user!.id);
            res.json(updated);
        } catch (error) {
            next(error);
        }
    }

    async submitPeerReview(req: Request, res: Response, next: NextFunction) {
        try {
            const { submissionId } = req.params;
            const { content, rating, feedback } = req.body;
            const user = req.user as any;

            if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
                return res.status(400).json({ message: "Invalid rating. Must be between 1 and 5." });
            }

            if (!content && !feedback) {
                return res.status(400).json({ message: "Review content or feedback is required" });
            }

            // Prevent duplicate reviews from same reviewer
            const existing = await assignmentsRepository.getExistingPeerReview(submissionId, user.id);
            if (existing) {
                return res.status(400).json({ message: "You have already submitted a review for this submission" });
            }

            // Get submission to check assignmentId and prevent self-review
            const submission = await assignmentsRepository.getSubmission(submissionId);
            if (!submission) {
                return res.status(404).json({ message: "Submission not found" });
            }

            if (submission.studentId === user.id) {
                return res.status(400).json({ message: "You cannot review your own submission" });
            }

            const review = await assignmentsRepository.createPeerReview({
                submissionId,
                reviewerId: user.id,
                assignmentId: submission.assignmentId,
                content: content || feedback,
                score: rating,
            });

            res.status(201).json(review);
        } catch (error) {
            next(error);
        }
    }

    async getAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const date = req.query.date as string;
            const att = await assignmentsRepository.getAttendance(req.params.classId as string, date);
            res.json(att);
        } catch (error) {
            next(error);
        }
    }

    async markAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const { date, records } = req.body;
            await assignmentsRepository.markAttendance(req.params.classId as string, date, records, user.id);
            res.status(201).json({ message: "Attendance marked" });
        } catch (error) {
            next(error);
        }
    }
}

export const assignmentsController = new AssignmentsController();
