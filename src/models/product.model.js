import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    stock: {
      type: Number,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    size: [{ type: String }],
    gender: {
      type: String,
      enum: ["men", "women", "boys", "girls"],
    },
    color: [{ type: String }],
    keywords: [
      {
        type: String,
      },
    ],
    slug: {
      type: String,
      unique: true,
    },
  },

  { timestamps: true },
);

productSchema.index({ name: "text", keywords: "text" });

export const Product = mongoose.model("Product", productSchema);
