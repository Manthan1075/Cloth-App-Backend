import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      trim: true,
      default: "",
    },

    images: [
      {
        url: String,
        fileId: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

reviewSchema.index(
  {
    customer: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

export const Review = mongoose.model("Review", reviewSchema);
