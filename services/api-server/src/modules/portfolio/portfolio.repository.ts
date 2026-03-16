import { db } from "../../core/database/db";
import { eq, desc } from "drizzle-orm";
import { portfolios, portfolioItems, certificates, users, assignments } from "@edusphere/types";

export class PortfolioRepository {
    async getPortfolioByUserId(userId: string) {
        const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
        return portfolio;
    }

    async getPortfolioBySlug(slug: string) {
        const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.slug, slug));
        return portfolio;
    }

    async createPortfolio(userId: string, slug: string) {
        const [portfolio] = await db.insert(portfolios).values({
            userId,
            slug,
        }).returning();
        return portfolio;
    }

    async updatePortfolio(id: string, data: any) {
        const [updated] = await db.update(portfolios).set(data).where(eq(portfolios.id, id)).returning();
        return updated;
    }

    async getPortfolioItems(portfolioId: string) {
        return await db.select().from(portfolioItems)
            .where(eq(portfolioItems.portfolioId, portfolioId))
            .orderBy(desc(portfolioItems.order));
    }

    async addPortfolioItem(item: any) {
        const [newItem] = await db.insert(portfolioItems).values(item).returning();
        return newItem;
    }

    async updatePortfolioItem(id: string, data: any) {
        await db.update(portfolioItems).set(data).where(eq(portfolioItems.id, id));
    }

    async deletePortfolioItem(id: string) {
        await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    }

    async removePortfolioItem(id: string) {
        await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    }

    async getCertificates(userId: string) {
        return await db.select().from(certificates).where(eq(certificates.studentId, userId));
    }

    async issueCertificate(cert: any) {
        const [newCert] = await db.insert(certificates).values(cert).returning();
        return newCert;
    }

    async getCertificatesByStudent(studentId: string) {
        return await db.select().from(certificates).where(eq(certificates.studentId, studentId));
    }

    async getCertificateByCode(code: string) {
        const [cert] = await db.select().from(certificates).where(eq(certificates.verificationCode, code));
        return cert;
    }

    async createCertificate(cert: any) {
        const [newCert] = await db.insert(certificates).values(cert).returning();
        return newCert;
    }

    async getUser(id: string) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getAssignment(id: string) {
        const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
        return assignment;
    }
}

export const portfolioRepository = new PortfolioRepository();
