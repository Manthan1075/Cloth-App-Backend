import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  slug: {
    type: String,
    required: true,
    unique: true,
  },

  image: {
    type: String,
    default: null,
  },

  imageFileId: {
    type: String,
    default: null,
  },

  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

export const Category = mongoose.model("Category", categorySchema);
