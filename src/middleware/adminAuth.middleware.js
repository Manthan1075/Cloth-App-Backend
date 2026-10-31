import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token =
      (authorization?.startsWith("Bearer ") && authorization.slice(7)) ||
      req.cookies.token ||
      req.body.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access! Please Login To Continue",
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    if (decode.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access!",
      });
    }

    const Admin = await User.findById(decode._id).select("-password");

    if (!Admin || Admin.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access!",
      });
    }

    return next();
  } catch (error) {
    if (
      ["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(
        error?.name,
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    console.error("Error In Admin Auth Middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
