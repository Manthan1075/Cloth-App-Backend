import { Router } from "express";
import {
  createUser,
  loginUser,
  loginAdmin,
  editUser,
  getUser,
  verifyPhoneForLogin,
  getAllUsers,
  toggleBlock,
  changeAdminPassword,
  forgetPassword,
  resetPassword,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// User Routes
router.post("/create-user", createUser);
router.post("/login", loginUser);
router.post("/verify-phone", verifyPhoneForLogin);
router.put("/edit-user/:id", authMiddleware, upload.single("avatar"), editUser);
router.get("/get/:id", getUser);

// Admin Routes
router.post("/login-admin", loginAdmin);
router.get("/get-all", adminAuthMiddleware, getAllUsers);
router.patch("/toggle-block/:id", adminAuthMiddleware, toggleBlock);
router.post("/change-admin-password", adminAuthMiddleware, changeAdminPassword);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:resetToken", resetPassword);

export default router;

