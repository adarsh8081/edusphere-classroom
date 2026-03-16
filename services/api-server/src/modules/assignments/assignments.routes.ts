import { Router, NextFunction, Request, Response } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";
import { assignmentsController } from "./assignments.controller";

const router = Router();

// ── Assignments ──────────────────────────────────────────────────────────────

router.get(api.assignments.list.path, requireAuth, assignmentsController.listAssignments);
router.post(api.assignments.create.path, requireTeacher, validateBody(api.assignments.create.input), assignmentsController.createAssignment);
router.get(api.assignments.get.path, requireAuth, assignmentsController.getAssignment);

// ── Submissions ──────────────────────────────────────────────────────────────

router.get(api.submissions.list.path, requireAuth, assignmentsController.listSubmissions);
router.post(api.submissions.create.path, requireAuth, validateBody(api.submissions.create.input), assignmentsController.createSubmission);
router.patch(api.submissions.grade.path, requireTeacher, validateBody(api.submissions.grade.input), assignmentsController.gradeSubmission);
router.post(api.submissions.checkPlagiarism.path, requireTeacher, assignmentsController.checkPlagiarism);
router.post("/api/submissions/:submissionId/peer-review", requireAuth, assignmentsController.submitPeerReview);

// ── Peer Reviews (Teacher) ───────────────────────────────────────────────────

router.get("/api/assignments/:id/reviews", requireTeacher, assignmentsController.getReviews);
router.patch("/api/reviews/:id", requireTeacher, assignmentsController.updateReview);

// ── Attendance ───────────────────────────────────────────────────────────────

router.get(api.attendance.list.path, requireAuth, assignmentsController.getAttendance);
router.post(api.attendance.mark.path, requireTeacher, validateBody(api.attendance.mark.input), assignmentsController.markAttendance);

// ── Attendance QR Routes ─────────────────────────────────────────────────────

router.post("/api/attendance/session", requireTeacher, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const { classId } = req.body;
        if (!classId) return res.status(400).json({ message: "classId is required" });
        const { startAttendanceSession } = await import("./attendance.service");
        const session = await startAttendanceSession(classId, user.id);
        res.status(201).json(session);
    } catch (err) {
        next(err);
    }
});

router.get("/api/classes/:classId/attendance/active", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { getActiveSession } = await import("./attendance.service");
        const session = await getActiveSession(req.params.classId as string);
        res.json(session || null);
    } catch (err) {
        next(err);
    }
});

router.post("/api/attendance/scan", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const { qrCode, latitude, longitude } = req.body;
        if (!qrCode) return res.status(400).json({ message: "qrCode is required" });
        const { markAttendance } = await import("./attendance.service");
        const result = await markAttendance(qrCode, user.id, latitude, longitude);
        res.json(result);
    } catch (err: any) {
        if (err.message) return res.status(400).json({ message: err.message });
        next(err);
    }
});

router.get("/api/attendance/session/:sessionId/stats", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { getSessionStats } = await import("./attendance.service");
        const stats = await getSessionStats(req.params.sessionId as string);
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

router.get("/api/attendance/export/:classId", requireTeacher, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { exportAttendanceToCSV } = await import("./attendance.service");
        const csv = await exportAttendanceToCSV(req.params.classId as string);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=attendance_${req.params.classId}.csv`);
        res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
});

export default router;
