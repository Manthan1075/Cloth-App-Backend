import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    imageFileId: {
      type: String,
      default: null,
    },
    redirectUrl: String,
    title: String,
  },
  { timestamps: true },
);

export const Banner = mongoose.model("Banner", bannerSchema);
