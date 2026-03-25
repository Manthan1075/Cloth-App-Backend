import { Admin } from "../models/admin.model.js";
import { compare, hash } from "bcrypt";

export const createAdmin = async (req, res) => {
  try {
    const { name, contact, password, email } = req.body;

    if (!name || !contact || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const hashedPassword = await hash(password, 10);

    const admin = await Admin.create({
      name,
      contact,
      password: hashedPassword,
      email,
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong while creating admin",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin created successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Error While Create Admin Account :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const email = identifier;
    const contact = identifier;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const admin = await Admin.findOne({ $or: [{ email }, { contact }] });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isPasswordMatched = await compare(password, admin.password);

    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Error While Admin Login :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const editAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Admin id is required",
      });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.name = name;
    admin.contact = contact;
    admin.email = email;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Error While Edit Admin Account :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    console.log("Error While Delete Admin Account :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.find();

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Error While Fetch Admin Account :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};
