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
router.post("/add-banner", upload.single("image"), addBanner);
router.delete("/delete-banner/:id", deleteBanner);
router.get("/get-banner/:id", getBanners);
router.get("/get-banner", getBanners);


export default router;
