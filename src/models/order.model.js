import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        price: {
          type: Number,
          required: true,
        },
        size: {
          type: String,
        },
        color: {
          type: String,
          required: true,
        },
        fabric: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    subTotal: {
      type: Number,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
