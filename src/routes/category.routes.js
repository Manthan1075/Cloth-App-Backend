import express from "express";
import {
  addCategory,
  getAllCategories,
  editCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post("/add", addCategory);
router.get("/get", getAllCategories);
router.put("/edit/:id", editCategory);
router.delete("/delete/:id", deleteCategory);

export default router;
