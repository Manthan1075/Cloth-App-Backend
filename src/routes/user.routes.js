import { Router } from "express";
import {
  createUser,
  editUser,
  getAllUsers,
  getUser,
  loginUser,
} from "../controllers/user.controller.js";

const router = Router();

router.post("/create-user", createUser);

router.post("/login", loginUser);

router.put("/edit-user/:id", editUser);

router.get("/get/:id", getUser);

router.get("/get-all", getAllUsers);

export default router;
