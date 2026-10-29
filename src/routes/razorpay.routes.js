import express from "express";
import { verifyRazorpayPayment } from "../controllers/razorpay.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Verify Razorpay payment signature (requires logged-in user)
router.post("/verify-payment", authMiddleware, verifyRazorpayPayment);

export default router;
