import { Order } from "../models/order.model.js";
import { sendEmail } from "./emailSend.js";

export const sendOrderEmails = async (orderId, { notifyAdmin = true, notifyCustomer = true } = {}) => {
  try {
    const order = await Order.findById(orderId).populate("customer", "name email").populate({
      path: "orderItems",
      populate: [
        { path: "product", select: "name images" },
        { path: "variant", select: "color size coverImage images" },
      ],
    }).lean();
    if (!order) return;
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const data = {
      customerName: order.deliveryAddress?.fullName || order.customer?.name || "Customer",
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      items: (order.orderItems || []).map((item) => ({
        productName: item.product?.name || "Aureve product",
        quantity: item.quantity,
        image: item.variant?.coverImage || item.variant?.images?.[0] || item.product?.images?.[0] || "",
        variant: [item.variant?.color, item.variant?.size].filter(Boolean).join(" · "),
        price: item.totalPrice,
      })),
    };
    const emails = [];
    if (notifyCustomer && order.customer?.email) emails.push(sendEmail({ to: order.customer.email, subject: `Aureve order ${order.orderNumber} received`, type: "orderPlaced", data }));
    if (notifyAdmin && adminEmail) emails.push(sendEmail({ to: adminEmail, subject: `New Aureve order ${order.orderNumber}`, type: "adminOrderPlaced", data }));
    else if (notifyAdmin) console.error("Admin order email skipped: ADMIN_EMAIL is not configured.");
    await Promise.all(emails);
  } catch (error) {
    console.error("Order email notification failed:", error);
  }
};
