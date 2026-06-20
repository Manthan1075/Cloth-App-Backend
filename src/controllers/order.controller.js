import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";


export const createOrder = async (req, res) => {
  try {
    const { customer, items, deliveryCharges = 0 } = req.body;

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer details are required",
      });
    }

    const {
      name,
      phone,
      email,
      address,
    } = customer;

    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone and address are required",
      });
    }

    // ==========================
    // ITEMS VALIDATION
    // ==========================

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order must contain at least one product",
      });
    }

    // ==========================
    // CREATE / UPDATE USER
    // ==========================

    let user = await User.findOne({
      phone,
    });

    if (!user) {
      user = await User.create({
        username: name,
        phone,
        email,
        address,
      });
    } else {
      user.username = name;

      if (email) {
        user.email = email;
      }

      user.address = address;

      await user.save();
    }

    let subTotal = 0;

    const orderItems = [];

    const stockUpdates = [];

    for (const item of items) {
      const {
        product,
        color,
        size,
        quantity = 1,
      } = item;

      if (!product) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID is required",
        });
      }

      const productData =
        await Product.findById(
          product
        );

      if (!productData) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      if (
        !productData.isAvailable
      ) {
        return res.status(400).json({
          success: false,
          message: `${productData.name} is currently unavailable`,
        });
      }

      if (
        productData.stock <
        quantity
      ) {
        return res.status(400).json({
          success: false,
          message: `Only ${productData.stock} stock available for ${productData.name}`,
        });
      }

      // Use DB price only
      const itemPrice =
        productData.price;

      subTotal +=
        itemPrice * quantity;

      orderItems.push({
        product:
          productData._id,
        price: itemPrice,
        color,
        size,
        quantity,
      });

      stockUpdates.push({
        productData,
        quantity,
      });
    }

    // ==========================
    // TOTAL CALCULATION
    // ==========================

    const totalAmount =
      subTotal +
      Number(deliveryCharges);

    // ==========================
    // CREATE ORDER
    // ==========================

    const order =
      await Order.create({
        customer: {
          name,
          phone,
          address,
        },

        items: orderItems,

        subTotal,

        deliveryCharges,

        totalAmount,

        status: "Pending",

        isDelivered: false,
      });

    // ==========================
    // UPDATE STOCK
    // ==========================

    for (const stockItem of stockUpdates) {
      stockItem.productData.stock -=
        stockItem.quantity;

      if (
        stockItem.productData.stock <=
        0
      ) {
        stockItem.productData.isAvailable =
          false;
      }

      await stockItem.productData.save();
    }

    // ==========================
    // RESPONSE
    // ==========================

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully",
      order,
    });
  } catch (error) {
    console.log(
      "Create Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
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
