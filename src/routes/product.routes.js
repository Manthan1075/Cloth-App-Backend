import express from "express";
import {
  addProduct,
  getProducts,
  editProduct,
  deleteProduct,
  getProductId,
} from "../controllers/product.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/add", upload.array("images"), addProduct);
router.get("/get", getProducts);
router.get("/get/id", getProductId);
router.patch("/edit/:id", editProduct);
router.delete("/delete/:id", deleteProduct);

export default router;
