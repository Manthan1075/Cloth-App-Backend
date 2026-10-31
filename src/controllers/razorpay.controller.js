import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { sendOrderEmails } from "../utils/orderNotification.js";

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are incomplete.",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({ success: false, message: "Online payment is not configured." });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    let supplied;
    try {
      supplied = Buffer.from(razorpay_signature, "hex");
    } catch {
      supplied = Buffer.alloc(0);
    }
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. The order has not been marked paid.",
      });
    }

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      customer: req.user._id,
      paymentMethod: "RAZORPAY",
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Matching order was not found." });
    }

    if (order.paymentStatus === "PAID" && order.razorpayPaymentId === razorpay_payment_id) {
      return res.status(200).json({ success: true, message: "Payment already verified.", order });
    }
    if (order.paymentStatus === "PAID") {
      return res.status(409).json({ success: false, message: "This order already has a verified payment." });
    }

    order.paymentStatus = "PAID";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();
    await sendOrderEmails(order._id, { notifyAdmin: false, notifyCustomer: true });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order,
    });
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify payment right now." });
  }
};
