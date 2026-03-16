import { Request, Response, NextFunction } from "express";
import { portfolioService } from "./portfolio.service";
import { certificateService } from "./certificate.service";
import { portfolioRepository } from "./portfolio.repository";

export class PortfolioController {
    async getMyPortfolio(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const portfolio = await portfolioService.ensureUserPortfolio(user.id, user.name);
            const items = await portfolioRepository.getPortfolioItems(portfolio.id);
            res.json({ ...portfolio, items });
        } catch (err) {
            next(err);
        }
    }

    async updateMyPortfolio(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { isPublic } = req.body;
            const portfolio = await portfolioService.ensureUserPortfolio(user.id, user.name);
            const updated = await portfolioRepository.updatePortfolio(portfolio.id, { isPublic: !!isPublic });
            res.json(updated);
        } catch (err) {
            next(err);
        }
    }

    async toggleItem(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { type, referenceId, title } = req.body;
            if (!type || !referenceId || !title) return res.status(400).send("Missing fields");
            const portfolio = await portfolioService.ensureUserPortfolio(user.id, user.name);
            const result = await portfolioService.toggleItemVisibility(portfolio.id, type, referenceId, title);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getPublicPortfolio(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await portfolioService.getPublicPortfolio(req.params.slug as string);
            if (!data) return res.status(404).send("Portfolio not found or private");
            res.json(data);
        } catch (err) {
            next(err);
        }
    }

    async getMyCertificates(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const certs = await certificateService.getStudentCertificates(user.id);
            res.json(certs);
        } catch (err) {
            next(err);
        }
    }

    async verifyCertificate(req: Request, res: Response, next: NextFunction) {
        try {
            const cert = await certificateService.verifyCertificate(req.params.code as string);
            if (!cert) return res.status(404).json({ message: "Invalid verification code" });
            const student = await portfolioRepository.getUser(cert.studentId);
            res.json({ ...cert, studentName: student?.name });
        } catch (err) {
            next(err);
        }
    }

    async downloadCertificate(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const certs = await certificateService.getStudentCertificates(user.id);
            const cert = certs.find(c => c.id === req.params.id as string);
            if (!cert) return res.status(404).json({ message: "Certificate not found or unauthorized" });
            const pdfBuffer = await certificateService.generateCertificatePDF(cert, user.name);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=certificate-${cert.verificationCode}.pdf`);
            res.send(pdfBuffer);
        } catch (err) {
            next(err);
        }
    }
}

export const portfolioController = new PortfolioController();
