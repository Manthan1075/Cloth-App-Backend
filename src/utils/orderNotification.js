import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "./emailSend.js";

export const sendOrderEmails = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("customer", "name email").populate({
      path: "orderItems",
      populate: { path: "product", select: "name" },
    }).lean();
    if (!order) return;
    const admin = await User.findOne({ role: "admin" }).select("email").lean();
    const data = {
      customerName: order.deliveryAddress?.fullName || order.customer?.name || "Customer",
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      items: (order.orderItems || []).map((item) => ({
        productName: item.product?.name || "Aureve product",
        quantity: item.quantity,
      })),
    };
    const emails = [];
    if (order.customer?.email) emails.push(sendEmail({ to: order.customer.email, subject: `Aureve order ${order.orderNumber} received`, type: "orderPlaced", data }));
    if (admin?.email) emails.push(sendEmail({ to: admin.email, subject: `New Aureve order ${order.orderNumber}`, type: "orderPlaced", data }));
    await Promise.all(emails);
  } catch (error) {
    console.error("Order email notification failed:", error);
  }
};
