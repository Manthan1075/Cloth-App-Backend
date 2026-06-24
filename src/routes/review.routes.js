import express from "express";
import {
  addReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public Routes
router.get("/product/:productId", getProductReviews);
router.get("/user/:customerId", getUserReviews);

// Protected/Customer Routes
router.post("/add", authMiddleware, upload.array("images"), addReview);
router.put("/edit/:id", authMiddleware, upload.array("images"), updateReview);
router.delete("/delete/:id", authMiddleware, deleteReview);

export default router;
