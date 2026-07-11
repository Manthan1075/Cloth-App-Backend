import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../controllers/product.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.post("/add", adminAuthMiddleware, upload.array("images"), createProduct);
router.get("/get", getProducts);
router.get("/get-product/:id", getProductById);
router.patch("/edit/:id", adminAuthMiddleware, updateProduct);
router.delete("/delete/:id", adminAuthMiddleware, deleteProduct);
router.patch("/toggle-status/:id", adminAuthMiddleware, toggleProductStatus);

export default router;

