import express from "express";
import {
  addCategory,
  getAllCategories,
  editCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/add", upload.single("image"), addCategory);
router.get("/get/:name", getAllCategories);
router.put("/edit/:id", editCategory);
router.delete("/delete/:id", deleteCategory);

export default router;
