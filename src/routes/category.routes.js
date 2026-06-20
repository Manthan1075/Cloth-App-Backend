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

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

/*
PUBLIC
*/

router.get("/", getAllCategories);

router.get("/tree", getCategoryTree);

router.get("/:id", getCategoryById);

/*
ADMIN
*/

router.post("/", upload.single("image"), addCategory);

router.put("/:id", upload.single("image"), editCategory);

router.delete("/:id", deleteCategory);

router.patch("/:id/status", toggleCategoryStatus);

export default router;
