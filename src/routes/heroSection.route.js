import { Router } from "express";
import {
  addBanner,
  deleteBanner,
  getBanners,
  getHeroSection,
  getBannerById,
  editBanner,
  toggleBannerStatus,
} from "../controllers/heroSection.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";

const router = Router();

// Public Routes
router.get("/get", getHeroSection);
router.get("/get-banner", getBanners);
router.get("/get-banner/:id", getBannerById);

// Admin Routes
router.post("/add-banner", adminAuthMiddleware, upload.single("image"), addBanner);
router.put("/edit-banner/:id", adminAuthMiddleware, upload.single("image"), editBanner);
router.delete("/delete-banner/:id", adminAuthMiddleware, deleteBanner);
router.patch("/toggle-banner-status/:id", adminAuthMiddleware, toggleBannerStatus);

export default router;

