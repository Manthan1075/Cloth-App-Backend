import express from "express";
import {
  createAdmin,
  adminLogin,
  editAdmin,
  deleteAdmin,
  getAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/create", createAdmin);
router.post("/login", adminLogin);
router.get("/get/:id", getAdmin);
router.get("/get", getAdmin);
router.patch("/edit/:id", editAdmin);
router.delete("/delete/:id", deleteAdmin);

export default router;
