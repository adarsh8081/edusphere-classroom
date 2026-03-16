import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth";
import { portfolioController } from "./portfolio.controller";

const router = Router();

// ── Portfolio ────────────────────────────────────────────────────────────────

router.get("/api/portfolio/me", requireAuth, portfolioController.getMyPortfolio);
router.patch("/api/portfolio/me", requireAuth, portfolioController.updateMyPortfolio);
router.post("/api/portfolio/toggle-item", requireAuth, portfolioController.toggleItem);
router.get("/api/portfolio/public/:slug", portfolioController.getPublicPortfolio);

// ── Certificates ─────────────────────────────────────────────────────────────

router.get("/api/certificates/me", requireAuth, portfolioController.getMyCertificates);
router.get("/api/certificates/verify/:code", portfolioController.verifyCertificate);
router.get("/api/certificates/download/:id", requireAuth, portfolioController.downloadCertificate);

export default router;
