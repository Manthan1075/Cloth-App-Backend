import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    contact: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true },
);

export const Admin = mongoose.model("Admin", adminSchema);
