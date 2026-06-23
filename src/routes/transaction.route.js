import express from "express";
import {
    purchaseStock,
    saleStock,
    returnStock,
} from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

// Admin Transaction Routes
router.post("/purchase", authMiddleware, adminAuthMiddleware, purchaseStock);
router.post("/sale", authMiddleware, adminAuthMiddleware, saleStock);
router.post("/return", authMiddleware, adminAuthMiddleware, returnStock);

export default router;
