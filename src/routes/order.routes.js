import express from "express";
import {
  createOrder,
  getAllOrder,
  getUserOrder,
  cancelOrder,
  editOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/create", createOrder);
router.get("/get-all-order", getAllOrder);
router.post("/get-user-order", getUserOrder);
router.patch("/cancel/:id", cancelOrder);
router.patch("/status", editOrderStatus);

export default router;
