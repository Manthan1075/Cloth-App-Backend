import express from "express";
import {
  createOrder,
  getAllOrder,
  getUserOrder,
  cancelOrder,
  editOrderStatus,
  getOrders,
  getOrderSummary,
  getOrderAnalytics,
  getMonthlySales,
  getTopSellingProducts,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
  requestReturn,
  rejectReturn,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", createOrder);

router.get("/", getOrderSummary);

router.get("/summary", getOrderSummary);

router.get("/analytics", getOrderAnalytics);

router.get("/monthly-sales", getMonthlySales);

router.get("/top-products", getTopSellingProducts);

router.get("/customer/:customerId", getCustomerOrders);

router.get("/:id", getOrderById);

router.patch("/:id/status", updateOrderStatus);

router.patch("/:id/cancel", cancelOrder);

router.patch("/:id/request-return", requestReturn);

router.patch("/:id/approve-return", approveReturn);

router.patch("/:id/reject-return", rejectReturn);

export default router;
