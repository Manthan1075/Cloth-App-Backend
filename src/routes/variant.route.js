import express from "express";
import {
    createVariant,
    updateVariant,
    deleteVariant,
    getVariantsByProduct,
    getVariantById,
    toggleVariantStatus,
} from "../controllers/variant.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

// Public Routes
router.get("/get-product-variants/:productId", getVariantsByProduct);
router.get("/get-variant/:id", getVariantById);

// Admin Routes
router.post("/add", adminAuthMiddleware, upload.array("images"), createVariant);
router.put("/edit/:id", adminAuthMiddleware, upload.array("images"), updateVariant);
router.delete("/delete/:id", adminAuthMiddleware, deleteVariant);
router.patch("/toggle-status/:id", adminAuthMiddleware, toggleVariantStatus);

export default router;
