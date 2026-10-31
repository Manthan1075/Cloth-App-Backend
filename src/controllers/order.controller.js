import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItem.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { ProductVariant } from "../models/productVariant.model.js";
import { InventoryTransaction } from "../models/inventoryTransaction.model.js";
import Razorpay from "razorpay";
import { sendOrderEmails } from "../utils/orderNotification.js";

const sendServerError = (res, error, label) => {
  console.error(`${label}:`, error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong on our side. Please try again later.",
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const generateOrderNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);

  return `AURV-${Date.now()}-${random}`;
};

const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "RETURNED",
  "CANCELLED",
];

const ADMIN_STATUS_TRANSITIONS = {
  PLACED: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
  CONFIRMED: ["PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
  PACKED: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURN_REQUESTED: [],
  RETURN_APPROVED: [],
  RETURN_REJECTED: [],
  RETURNED: [],
};

const hasStockBeenDeducted = (order) => order.isStockDeducted || [
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_REJECTED",
].includes(order.status);

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      customer: customerField,
      deliveryAddress,
      items,
      paymentMethod = "COD",
    } = req.body;

    const customerId = req.user?._id;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer id is required.",
      });
    }

    if (customerField && String(customerField) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: "You can only place orders for your own account.",
      });
    }

    if (!["COD", "RAZORPAY"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment method.",
      });
    }

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer id.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
    }

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    let subTotal = 0;

    const orderItemsData = [];

    for (const item of items) {
      const { variantId, quantity } = item;

      if (!variantId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        return res.status(400).json({
          success: false,
          message: "Each order item needs a valid selected product variant and quantity.",
        });
      }

      const variant = await ProductVariant.findById(variantId)
        .populate("product")
        .session(session);

      if (!variant) {
        throw new Error("Variant not found.");
      }

      if (!variant.isActive) {
        throw new Error(
          `${variant.color} ${variant.size} variant is unavailable.`,
        );
      }

      if (variant.currentStock < quantity) {
        throw new Error(
          `Only ${variant.currentStock} stock available for ${variant.color}-${variant.size}.`,
        );
      }

      const totalPrice = variant.sellingPrice * quantity;

      subTotal += totalPrice;

      orderItemsData.push({
        product: variant.product._id,

        variant: variant._id,

        quantity,

        sellingPrice: variant.sellingPrice,

        totalPrice,
      });
    }

    const serverDeliveryCharges = subTotal >= 499 ? 0 : 49;
    const totalAmount = Number((subTotal + serverDeliveryCharges).toFixed(2));

    const order = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),

          customer: customer._id,

          deliveryAddress,

          subTotal,

          deliveryCharges: serverDeliveryCharges,

          totalAmount,

          paymentMethod,

          status: "PLACED",

          isStockDeducted: false,
        },
      ],
      { session },
    );

    const createdOrder = order[0];

    const orderItems = [];

    for (const item of orderItemsData) {
      const orderItem = await OrderItem.create(
        [
          {
            order: createdOrder._id,

            product: item.product,

            variant: item.variant,

            quantity: item.quantity,

            sellingPrice: item.sellingPrice,

            totalPrice: item.totalPrice,
          },
        ],
        { session },
      );

      orderItems.push(orderItem[0]._id);
    }

    createdOrder.orderItems = orderItems;

    await createdOrder.save({
      session,
    });

    let razorpayCheckout = null;
    if (paymentMethod === "RAZORPAY") {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        throw new Error("Razorpay is not configured on the server.");
      }
      if (process.env.RAZORPAY_MODE === "test" && !keyId.startsWith("rzp_test_")) {
        throw new Error("Razorpay is set to test mode, but the configured key is not a test key.");
      }
      const gateway = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const gatewayOrder = await gateway.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: createdOrder.orderNumber,
        notes: { shopOrderId: String(createdOrder._id) },
      });
      createdOrder.razorpayOrderId = gatewayOrder.id;
      await createdOrder.save({ session });
      razorpayCheckout = {
        keyId,
        orderId: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
      };
    }

    await session.commitTransaction();

    await sendOrderEmails(createdOrder._id, {
      notifyAdmin: true,
      notifyCustomer: paymentMethod === "COD",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",

      order: createdOrder,
      razorpay: razorpayCheckout,
    });
  } catch (error) {
    await session.abortTransaction();

    return sendServerError(res, error, "Create Order Error");
  } finally {
    session.endSession();
  }
};

export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      search,
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    if (status && ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (customer && isValidObjectId(customer)) {
      filter.customer = customer;
    }

    const normalizedSearch = String(search || "").trim().slice(0, 100);
    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingCustomers = await User.find({
        $or: [
          { name: { $regex: escapedSearch, $options: "i" } },
          { email: { $regex: escapedSearch, $options: "i" } },
          { phone: { $regex: escapedSearch, $options: "i" } },
        ],
      }).distinct("_id");
      filter.$or = [
        { orderNumber: { $regex: escapedSearch, $options: "i" } },
        { customer: { $in: matchingCustomers } },
      ];
    }

    const sortOption =
      sort === "oldest"
        ? {
            createdAt: 1,
          }
        : {
            createdAt: -1,
          };

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name phone email")
        .populate({
          path: "orderItems",
          populate: [
            { path: "product", select: "name images coverImage" },
            { path: "variant", select: "color size sku coverImage images" },
          ],
        })
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      orders,

      totalOrders,

      currentPage: pageNumber,

      totalPages: Math.ceil(totalOrders / limitNumber) || 1,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Orders Error");
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(id)
      .populate("customer", "name phone email")
      .populate({
        path: "orderItems",
        populate: [
          {
            path: "product",
            select: "name slug images coverImage",
          },
          {
            path: "variant",
            select: "color size sku sellingPrice coverImage images",
          },
        ],
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (String(order.customer?._id || order.customer) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You are not allowed to view this order." });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Order By Id Error");
  }
};

const createInventoryTransaction = async ({
  variant,
  type,
  quantity,
  previousStock,
  newStock,
  referenceId = null,
  note = "",
  createdBy,
  session,
}) => {
  const [transaction] = await InventoryTransaction.create(
    [{
      variant,
      type,
      quantity,
      previousStock,
      newStock,
      referenceId,
      note,
      createdBy,
    }],
    { session },
  );
  return transaction;
};

const deductStockForOrder = async (order, adminId, session) => {
  await order.populate({
    path: "orderItems",
    populate: {
      path: "variant",
    },
  });

  for (const item of order.orderItems) {
    const variant = await ProductVariant.findById(item.variant._id).session(
      session,
    );

    if (!variant) {
      throw new Error("Variant not found.");
    }

    if (variant.currentStock < item.quantity) {
      throw new Error(
        `${variant.color}-${variant.size} has insufficient stock.`,
      );
    }

    const previousStock = variant.currentStock;

    const newStock = previousStock - item.quantity;

    variant.currentStock = newStock;

    await variant.save({
      session,
    });

    await createInventoryTransaction({
      variant: variant._id,

      type: "SALE",

      quantity: item.quantity,

      previousStock,

      newStock,

      referenceId: order._id,

      note: "Order confirmed",

      createdBy: adminId,
      session,
    });
  }
};

const restoreStockForOrder = async (
  order,
  adminId,
  transactionType,
  note,
  session,
) => {
  await order.populate({
    path: "orderItems",
    populate: {
      path: "variant",
    },
  });

  for (const item of order.orderItems) {
    const variant = await ProductVariant.findById(item.variant._id).session(
      session,
    );

    if (!variant) {
      continue;
    }

    const previousStock = variant.currentStock;

    const newStock = previousStock + item.quantity;

    variant.currentStock = newStock;

    await variant.save({
      session,
    });

    await createInventoryTransaction({
      variant: variant._id,

      type: transactionType,

      quantity: item.quantity,

      previousStock,

      newStock,

      referenceId: order._id,

      note,

      createdBy: adminId,
      session,
    });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer id.",
      });
    }

    if (String(customerId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this customer's orders.",
      });
    }

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const [orders, totalOrders] = await Promise.all([
      Order.find({
        customer: customerId,
      })
        .populate({
          path: "orderItems",
          populate: [
            { path: "product", select: "name slug images coverImage" },
            { path: "variant", select: "color size coverImage images" },
          ],
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Order.countDocuments({
        customer: customerId,
      }),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      totalOrders,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalOrders / limitNumber) || 1,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Customer Orders Error");
  }
};

export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    const { status } = req.body;

    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    if (!ORDER_STATUSES.includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    if (["RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_REJECTED", "RETURNED"].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Use the return review actions to process a return.",
      });
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (status !== order.status && !ADMIN_STATUS_TRANSITIONS[order.status]?.includes(status)) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: `Order status cannot move from ${order.status} to ${status}.`,
      });
    }

    if (status === "CONFIRMED" && order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID") {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "This online order cannot be confirmed until its payment is verified.",
      });
    }

    if (hasStockBeenDeducted(order)) order.isStockDeducted = true;

    /*
       Deduct stock only once
      */

    if (["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"].includes(status) && !order.isStockDeducted) {
      await deductStockForOrder(order, req.user._id, session);

      order.isStockDeducted = true;
    }

    if (status === "CANCELLED" && order.isStockDeducted) {
      await restoreStockForOrder(
        order,
        req.user._id,
        "CANCEL",
        "Order cancelled",
        session,
      );
      order.isStockDeducted = false;
    }

    order.status = status;

    await order.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();

    return sendServerError(res, error, "Update Order Status Error");
  } finally {
    session.endSession();
  }
};

export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (String(order.customer) !== String(req.user._id) && req.user.role !== "admin") {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "You are not allowed to cancel this order." });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled.",
      });
    }

    if (["DELIVERED", "RETURNED"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled.",
      });
    }

    if (hasStockBeenDeducted(order)) {
      order.isStockDeducted = true;
      await restoreStockForOrder(
        order,
        req.user._id,
        "CANCEL",
        "Order cancelled",
        session,
      );

      order.isStockDeducted = false;
    }

    order.status = "CANCELLED";

    await order.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();

    return sendServerError(res, error, "Cancel Order Error");
  } finally {
    session.endSession();
  }
};

export const requestReturn = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (String(order.customer) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to request a return for this order.",
      });
    }

    if (order.status !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned.",
      });
    }

    order.status = "RETURN_REQUESTED";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully.",
      order,
    });
  } catch (error) {
    return sendServerError(res, error, "Request Return Error");
  }
};

export const approveReturn = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "RETURN_REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "Return request not found.",
      });
    }

    if (!hasStockBeenDeducted(order)) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "Stock was not deducted for this order, so it cannot be restocked as a return.",
      });
    }

    /*
       Restore stock
      */

    await restoreStockForOrder(
      order,
      req.user._id,
      "RETURN",
      "Order returned",
      session,
    );

    order.status = "RETURNED";

    order.isStockDeducted = false;

    await order.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Return approved successfully.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();

    return sendServerError(res, error, "Approve Return Error");
  } finally {
    session.endSession();
  }
};

export const rejectReturn = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "RETURN_REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "Return request not found.",
      });
    }

    order.status = "RETURN_REJECTED";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return request rejected successfully.",
      order,
    });
  } catch (error) {
    return sendServerError(res, error, "Reject Return Error");
  }
};

export const getOrderSummary = async (req, res) => {
  try {
    const [
      totalOrders,
      placedOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),

      Order.countDocuments({
        status: "PLACED",
      }),

      Order.countDocuments({
        status: "CONFIRMED",
      }),

      Order.countDocuments({
        status: "SHIPPED",
      }),

      Order.countDocuments({
        status: "DELIVERED",
      }),

      Order.countDocuments({
        status: "CANCELLED",
      }),

      Order.countDocuments({
        status: "RETURNED",
      }),

      Order.aggregate([
        {
          $match: {
            status: {
              $in: ["DELIVERED", "SHIPPED"],
            },
          },
        },

        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,

      summary: {
        totalOrders,

        placedOrders,

        confirmedOrders,

        shippedOrders,

        deliveredOrders,

        cancelledOrders,

        returnedOrders,

        totalRevenue: revenueResult[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    return sendServerError(res, error, "Get Order Summary Error");
  }
};

export const getOrderAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();

    startDate.setDate(startDate.getDate() - Number(days));

    const analytics = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,

      period: `${days} days`,

      analytics,
    });
  } catch (error) {
    return sendServerError(res, error, "Order Analytics Error");
  }
};

export const getMonthlySales = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const sales = await Order.aggregate([
      {
        $match: {
          status: "DELIVERED",

          createdAt: {
            $gte: new Date(year, 0, 1),

            $lt: new Date(year + 1, 0, 1),
          },
        },
      },

      {
        $group: {
          _id: {
            month: {
              $month: "$createdAt",
            },
          },

          sales: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      year,
      sales,
    });
  } catch (error) {
    return sendServerError(res, error, "Monthly Sales Error");
  }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const products = await OrderItem.aggregate([
      {
        $group: {
          _id: "$product",

          totalSold: {
            $sum: "$quantity",
          },

          revenue: {
            $sum: "$totalPrice",
          },
        },
      },

      {
        $sort: {
          totalSold: -1,
        },
      },

      {
        $limit: limit,
      },

      {
        $lookup: {
          from: "products",

          localField: "_id",

          foreignField: "_id",

          as: "product",
        },
      },

      {
        $unwind: "$product",
      },
    ]);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return sendServerError(res, error, "Top Products Error");
  }
};
