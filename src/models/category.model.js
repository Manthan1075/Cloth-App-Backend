import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

export const Category = mongoose.model("Category", categorySchema);
