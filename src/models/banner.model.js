import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    link: String,
    title: String,
  },
  { timestamps: true },
);

export default mongoose.model("Banner", bannerSchema);
