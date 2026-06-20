import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]) ||
      req.body.token;

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
    console.log("Error While Verify User :", error);
    return res
      .status(500)
      .json({ success: true, message: "Internal Server Error" });
  }
};
