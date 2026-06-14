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
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    notificationToken: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Admin = mongoose.model("Admin", adminSchema);
