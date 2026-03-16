import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { log } from "../../core/logger/index";

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, password, email, role, classCode } = req.body;
            const user = await authService.registerUser({ name, password, email, role, classCode });

            // Log in the user after successful registration
            req.login(user, (err) => {
                if (err) return next(err);
                return res.status(201).json(user);
            });
        } catch (error: any) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            return res.status(200).json(req.user);
        } catch (error: any) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            req.logout((err) => {
                if (err) return next(err);
                return res.status(200).json({ message: "Logged out successfully" });
            });
        } catch (error: any) {
            next(error);
        }
    }

    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            return res.status(200).json(req.user);
        } catch (error: any) {
            next(error);
        }
    }

    mockAuth = async (req: Request, res: Response) => {
        if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") {
            return res.status(403).send("Mock auth only available in development");
        }

        const provider = req.params.provider as string;
        const providerId = `mock_${provider}_${Math.floor(Math.random() * 10000)}`;
        const name = `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
        const email = `${provider}_test@example.com`;

        try {
            const user = await authService.findOrCreateOAuthUser(provider, providerId, email, name);
            req.login(user, (err) => {
                if (err) return res.status(500).send("Login failed");
                res.redirect("/");
            });
        } catch (err) {
            res.status(500).send("Creation failed");
        }
    }
}

export const authController = new AuthController();
