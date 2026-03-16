import { Router } from "express";
import express from "express";
import path from "path";

import { apiRateLimiter } from "../../core/middleware/rateLimiter";

import classesRoutes from "../../modules/classes/classes.routes";
import contentRoutes from "../../modules/classes/content.routes";
import assignmentsRoutes from "../../modules/assignments/assignments.routes";
import aiRoutes from "../../modules/ai/ai.routes";
import messagingRoutes from "../../modules/messaging/messaging.routes";
import notificationsRoutes from "../../modules/notifications/notifications.routes";
import wellbeingRoutes from "../../modules/wellbeing/wellbeing.routes";
import adminRoutes from "../../modules/admin/admin.routes";
import guildsRoutes from "../../modules/guilds/guilds.routes";
import parentsRoutes from "../../modules/parents/parents.routes";
import gamificationRoutes from "../../modules/gamification/gamification.routes";
import portfolioRoutes from "../../modules/portfolio/portfolio.routes";
import marketplaceRoutes from "../../modules/marketplace/marketplace.routes";
import usersRoutes from "../../modules/users/users.routes";
import analyticsRoutes from "../../modules/analytics/analytics.routes";
import authRoutes from "../../modules/auth/auth.routes";

const v1Router = Router();

// global API rate limiting per user
v1Router.use(apiRateLimiter);

// Serve locally-uploaded files
v1Router.use("/uploads", express.static(path.resolve("uploads")));

// Mount all domain module routes
v1Router.use(classesRoutes);
v1Router.use(contentRoutes);
v1Router.use(assignmentsRoutes);
v1Router.use(aiRoutes);
v1Router.use(messagingRoutes);
v1Router.use(notificationsRoutes);
v1Router.use(wellbeingRoutes);
v1Router.use(adminRoutes);
v1Router.use(guildsRoutes);
v1Router.use(parentsRoutes);
v1Router.use(gamificationRoutes);
v1Router.use(portfolioRoutes);
v1Router.use(marketplaceRoutes);
v1Router.use(usersRoutes);
v1Router.use(analyticsRoutes);
v1Router.use(authRoutes);

export default v1Router;
