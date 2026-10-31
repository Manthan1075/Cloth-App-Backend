import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]) ||
      req.params.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access! Please Login To Continue",
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    next();
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

    console.error("Error In User Auth Middleware:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
