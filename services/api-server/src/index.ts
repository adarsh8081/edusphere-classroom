/**
 * API Server Entry Point — EduSphere Platform
 *
 * Boot sequence:
 * 1. Load environment variables
 * 2. Create Express app + HTTP server
 * 3. Apply core middleware (JSON, URL-encoded, security headers)
 * 4. Request logger middleware
 * 5. Connect Redis
 * 6. Setup authentication (Passport)
 * 7. Mount API v1 router (all modular routes)
 * 8. Setup Socket.io real-time layer
 * 9. Error handler middleware
 * 10. Vite dev server (dev) or static serving (prod)
 * 11. Listen on PORT
 */
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { connectRedis } from "./core/redis/index";
import { setupSocket } from "./websocket/socket";
import { securityHeaders } from "./core/middleware/security";
import { errorHandler } from "./core/middleware/errorHandler";
import { log } from "./core/logger/index";
import { setupAuth } from "./modules/auth/auth.strategies";
import v1Router from "./api/v1/router";
import { seedBadges } from "./modules/gamification/gamification.service";

export const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ── Core Middleware ──────────────────────────────────────────────────────────

app.use(securityHeaders);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// ── Request Logger ───────────────────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ── Application Bootstrap ────────────────────────────────────────────────────

// ── Application Initialization ───────────────────────────────────────────────

// Setup authentication strategies
setupAuth(app);

// Mount all API routes
app.use(v1Router);

(async () => {
  // Connect Redis (graceful fallback if unavailable)
  await connectRedis();

  // Initialize AI Worker
  import("./core/queue/ai.worker").catch(err => {
    console.error("[AI Worker] Failed to start:", err);
  });

  // Seed gamification badges
  seedBadges().catch(console.error);

  // ── Health Check (used by Playwright webServer readiness probe) ─────────────
  app.get('/api/health-check', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Setup real-time communication
  setupSocket(httpServer);

  // Global error handler
  app.use(errorHandler);

  // Vite dev server (development) or static serving (production)
  if (process.env.NODE_ENV === "production") {
    const { serveStatic } = await import("./core/middleware/static");
    serveStatic(app);
  } else if (process.env.SERVE_FRONTEND === "true") {
    const { setupVite } = await import("./core/middleware/vite");
    await setupVite(httpServer, app);
  }

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port }, () => {
    log(`serving on port ${port}`);
  });
})();
