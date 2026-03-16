import { portfolioRepository } from "./portfolio.repository";

export class PortfolioService {
    async getPublicPortfolio(slug: string) {
        const portfolio = await portfolioRepository.getPortfolioBySlug(slug);
        if (!portfolio || !portfolio.isPublic) return null;

        const user = await portfolioRepository.getUser(portfolio.userId);
        if (!user) return null;

        const items = await portfolioRepository.getPortfolioItems(portfolio.id);

        // Enrich items with real data if needed (e.g., assignment details)
        const enrichedItems = await Promise.all(items.map(async (item: any) => {
            if (item.type === 'assignment_submission') {
                const submission = await portfolioRepository.getAssignment(item.referenceId);
                return { ...item, extra: submission };
            }
            return item;
        }));

        return {
            portfolio,
            user: {
                name: user.name,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                skills: user.skills,
            },
            items: enrichedItems,
        };
    }

    async ensureUserPortfolio(userId: string, name: string) {
        let portfolio = await portfolioRepository.getPortfolioByUserId(userId);
        if (!portfolio) {
            // Generate a basic slug: name-random
            const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
            portfolio = await portfolioRepository.createPortfolio(userId, slug);
        }
        return portfolio;
    }

    async toggleItemVisibility(portfolioId: string, type: string, referenceId: string, title: string) {
        const items = await portfolioRepository.getPortfolioItems(portfolioId);
        const existing = items.find(i => i.type === type && i.referenceId === referenceId);

        if (existing) {
            await portfolioRepository.removePortfolioItem(existing.id);
            return { action: 'removed' };
        } else {
            await portfolioRepository.addPortfolioItem({
                portfolioId,
                type,
                referenceId,
                title,
                isVisible: true,
                order: items.length
            });
            return { action: 'added' };
        }
    }

    async setPortfolioPublic(portfolioId: string, isPublic: boolean) {
        return await portfolioRepository.updatePortfolio(portfolioId, { isPublic });
    }
}

export const portfolioService = new PortfolioService();
