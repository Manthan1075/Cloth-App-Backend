import { Order } from "../models/order.model.js";

export const createOrder = async (req, res) => {
  try {
    const { customer, items, deliveryCharges = 0 } = req.body;
    const { name, contact, address } = customer;

    if (!name || !contact || !address) {
      return res.status(400).json({
        success: false,
        message: "Customer Detail Is Missing!",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order Must Contain At Least One Item!",
      });
    }

    const requiredField = ["product", "price", "size", "color", "fabric"];
    let subTotal = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const missingFields = requiredField.filter((field) => !item[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing: ${missingFields.join(", ")}`,
        });
      }

      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      subTotal += item.price * quantity;
    }

    const totalAmount = subTotal + deliveryCharges;

    const order = await Order.create({
      customer,
      items,
      subTotal,
      deliveryCharges,
      totalAmount,
      status: "Pending",
    });

    if (!order) {
      return res.status(500).json({
        success: false,
        message: "Failed To Order Products. Please Try Again!",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order Booked Successfully",
      order,
    });
  } catch (error) {
    console.log("Error While Create Order ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const getAllOrder = async (req, res) => {
  try {
    const {
      page = 0,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const validSortFields = ["createdAt", "totalAmount", "status"];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy! Valid Options Are: ${validSortFields.join(", ")}`,
      });
    }

    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortOrder! Use 'asc' or 'desc'",
      });
    }

    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
      .populate("items.product", "name images")
      .sort(sortOptions)
      .skip(pageNum * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total: totalOrders,
      page: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum),
      orders,
    });
  } catch (error) {
    console.log("Error While Getting All Orders ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const getUserOrder = async (req, res) => {
  try {
    const { contact, page = 0, limit = 10 } = req.body;

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: "Contact Is Required!",
      });
    }
    const orders = await Order.find({ "customer.contact": contact })
      .limit(limit)
      .skip(page * limit);

    if (!orders || orders.length == 0) {
      return res.status(404).json({
        success: true,
        message: "No Order Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Orders Fetched Successfully",
      orders,
    });
  } catch (error) {
    console.log("Error While Get User Order ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order Id Is Required!",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status: "Cancelled" },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order Cancelled Successfully",
      order,
    });
  } catch (error) {
    console.log("Error While Cancel Order ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const editOrderStatus = async (req, res) => {
  try {
    const { id, status, isDelivered } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Order Id And Status Are Required!",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        isDelivered,
      },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order Status Updated Successfully",
      order,
    });
  } catch (error) {
    console.log("Error While Edit Order Status ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};
