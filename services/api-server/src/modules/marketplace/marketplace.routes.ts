import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";
import { marketplaceController } from "./marketplace.controller";

const router = Router();

router.get(api.marketplace.list.path, requireAuth, marketplaceController.listItems);
router.get(api.marketplace.get.path, requireAuth, marketplaceController.getItem);
router.post(api.marketplace.create.path, requireAuth, validateBody(api.marketplace.create.input), marketplaceController.createItem);
router.post(api.marketplace.purchase.path, requireAuth, marketplaceController.purchaseItem);
router.get(api.marketplace.purchases.path, requireAuth, marketplaceController.getUserPurchases);

export default router;
