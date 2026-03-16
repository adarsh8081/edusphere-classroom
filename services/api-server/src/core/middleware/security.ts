import type { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware — production hardening
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // XSS protection (legacy browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions policy
    res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(self)"
    );
    next();
}
