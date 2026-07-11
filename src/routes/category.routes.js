import express from "express";

import {
  addCategory,
  getAllCategories,
  getCategoryById,
  getCategoryTree,
  editCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../controllers/category.controller.js";

import { adminAuthMiddleware } from "../middleware/adminAuth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();


router.get("/", getAllCategories);

router.get("/tree", getCategoryTree);

router.get("/:id", getCategoryById);



router.post("/", adminAuthMiddleware, upload.single("image"), addCategory);

router.put("/:id", adminAuthMiddleware, upload.single("image"), editCategory);

router.delete("/:id", adminAuthMiddleware, deleteCategory);

router.patch("/:id/status", adminAuthMiddleware, toggleCategoryStatus);

export default router;

