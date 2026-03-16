import { Router } from "express";
import passport from "passport";
import { authController } from "./auth.controller";
import { validateBody } from "../../core/middleware/validation";
import { authRateLimiter } from "../../core/middleware/rateLimiter";
import { insertUserSchema } from "@edusphere/types";
import { z } from "zod";
import { requireAuth } from "../../core/middleware/auth";
import { assignmentsController } from "../assignments/assignments.controller";

const router = Router();

// ===== Local Auth Routes =====
router.post("/api/register", authRateLimiter, validateBody(insertUserSchema), authController.register);

router.post(
  "/api/login",
  authRateLimiter,
  validateBody(z.object({ email: z.string().email(), password: z.string() })),
  (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        return authController.login(req, res, next);
      });
    })(req, res, next);
  },
);

router.post("/api/logout", authController.logout);

// ===== OAuth Routes =====
router.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  },
);

router.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/api/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  },
);

// ===== Mock OAuth for Development =====
router.get("/api/auth/mock/:provider", authController.mockAuth);

router.get("/api/me", requireAuth, authController.getMe);

export default router;
