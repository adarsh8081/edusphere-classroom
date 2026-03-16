import { Request, Response, NextFunction } from "express";
import { marketplaceRepository } from "./marketplace.repository";

export class MarketplaceController {
    async listItems(req: Request, res: Response, next: NextFunction) {
        try {
            const { category, sellerId } = req.query as any;
            const items = await marketplaceRepository.getMarketplaceItems({ category, sellerId });
            res.json(items);
        } catch (err) {
            next(err);
        }
    }

    async getItem(req: Request, res: Response, next: NextFunction) {
        try {
            const item = await marketplaceRepository.getMarketplaceItem(req.params.itemId as string);
            if (!item) return res.status(404).json({ message: "Item not found" });
            res.json(item);
        } catch (err) {
            next(err);
        }
    }

    async createItem(req: Request, res: Response, next: NextFunction) {
        try {
            if (req.user!.role !== "teacher" && req.user!.role !== "super_admin") return res.status(403).json({ message: "Forbidden" });
            const data = req.body; // Validation handled by route middleware
            const item = await marketplaceRepository.createMarketplaceItem({ ...data, sellerId: req.user!.id });
            res.status(201).json(item);
        } catch (err: any) {
            if (err.message) return res.status(400).json({ message: err.message });
            next(err);
        }
    }

    async purchaseItem(req: Request, res: Response, next: NextFunction) {
        try {
            const itemId = req.params.itemId as string;
            const item = await marketplaceRepository.getMarketplaceItem(itemId);
            if (!item) return res.status(404).json({ message: "Item not found" });
            if (item.sellerId === req.user!.id) return res.status(400).json({ message: "You cannot purchase your own item" });
            const purchase = await marketplaceRepository.purchaseMarketplaceItem(req.user!.id, itemId);
            res.json(purchase);
        } catch (err: any) {
            res.status(400).json({ message: "Item already purchased or invalid" });
        }
    }

    async getUserPurchases(req: Request, res: Response, next: NextFunction) {
        try {
            const purchases = await marketplaceRepository.getUserPurchases(req.user!.id);
            res.json(purchases);
        } catch (err) {
            next(err);
        }
    }
}

export const marketplaceController = new MarketplaceController();
