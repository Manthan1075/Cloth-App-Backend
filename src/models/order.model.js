import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
      },
    ],

    deliveryAddress: {
      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      pincode: {
        type: String,
        required: true,
      },
    },

    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
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
      ],
      default: "PLACED",
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({
  customer: 1,
  createdAt: -1,
});

export const Order = mongoose.model("Order", orderSchema);
