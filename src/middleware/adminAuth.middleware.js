import { Admin } from "../models/admin.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const id = req.cookies.id || req.body.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access!",
      });
    }

    const Admin = await Admin.findById(id);

    if (Admin) {
      next();
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized Access!",
    });
  } catch (error) {
    console.log("Error In Auth Middleware : ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
