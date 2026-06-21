import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    coverImage: {
      type: String,
      default: null,
    },

    images: [
      {
        type: String
      }
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

productVariantSchema.index(
  {
    product: 1,
    color: 1,
    size: 1,
  },
  {
    unique: true,
  },
);

export const ProductVariant = mongoose.model(
  "ProductVariant",
  productVariantSchema,
);
