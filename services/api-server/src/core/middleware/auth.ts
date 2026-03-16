import type { Request, Response, NextFunction } from "express";

/**
 * Middleware: require authenticated user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

/**
 * Middleware: require teacher role
 */
export function requireTeacher(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (!user || (user.role !== "teacher" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Forbidden: Teacher access required" });
    }
    next();
}

/**
 * Middleware: require super_admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
}
