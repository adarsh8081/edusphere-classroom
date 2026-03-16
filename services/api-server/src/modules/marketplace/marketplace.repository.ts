import { db } from "../../core/database/db";
import { eq, and, desc } from "drizzle-orm";
import { marketplaceItems, marketplacePurchases } from "@edusphere/types";

export class MarketplaceRepository {
    async getMarketplaceItems(filters?: { category?: string, sellerId?: string }) {
        const conditions = [];
        if (filters?.category) conditions.push(eq(marketplaceItems.category, filters.category));
        if (filters?.sellerId) conditions.push(eq(marketplaceItems.sellerId, filters.sellerId));
        if (conditions.length > 0) {
            return await db.select().from(marketplaceItems).where(and(...conditions));
        }
        return await db.select().from(marketplaceItems);
    }

    async getMarketplaceItem(id: string) {
        const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
        return item;
    }

    async createMarketplaceItem(item: any) {
        const [created] = await db.insert(marketplaceItems).values(item).returning();
        return created;
    }

    async purchaseMarketplaceItem(buyerId: string, itemId: string) {
        const [purchase] = await db.insert(marketplacePurchases).values({ buyerId, itemId }).returning();
        return purchase;
    }

    async getUserPurchases(userId: string) {
        const purchases = await db.select().from(marketplacePurchases).where(eq(marketplacePurchases.buyerId, userId));
        const items = [];
        for (const p of purchases) {
            const item = await this.getMarketplaceItem(p.itemId);
            if (item) items.push(item);
        }
        return items;
    }
}

export const marketplaceRepository = new MarketplaceRepository();
