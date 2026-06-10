import { Router } from "express";
import {
  addBanner,
  deleteBanner,
  getBanners,
  getHeroSection,
} from "../controllers/heroSection.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.get("/get", getHeroSection);
router.put("/add-banner", upload.single("banner"), addBanner);
router.get("/delete-banner", deleteBanner);
router.get("/get-banner", getBanners);

export default router;
