import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  getCustomerOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  approveReturn,
  rejectReturn,
  getOrderSummary,
  getOrderAnalytics,
  getMonthlySales,
  getTopSellingProducts,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

// Customer/General Routes
router.post("/", authMiddleware, createOrder);
router.get("/customer/:customerId", authMiddleware, getCustomerOrders);
router.get("/:id", authMiddleware, getOrderById);
router.patch("/:id/cancel", authMiddleware, cancelOrder);
router.patch("/:id/request-return", authMiddleware, requestReturn);

// Admin Routes
router.get("/", adminAuthMiddleware, getOrders);
router.get("/summary", adminAuthMiddleware, getOrderSummary);
router.get("/analytics", adminAuthMiddleware, getOrderAnalytics);
router.get("/monthly-sales", adminAuthMiddleware, getMonthlySales);
router.get("/top-products", adminAuthMiddleware, getTopSellingProducts);
router.patch("/:id/status", adminAuthMiddleware, updateOrderStatus);
router.patch("/:id/approve-return", adminAuthMiddleware, approveReturn);
router.patch("/:id/reject-return", adminAuthMiddleware, rejectReturn);

export default router;

