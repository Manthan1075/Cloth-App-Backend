import { Admin } from "../models/admin.model.js";
import { compare, hash } from "bcrypt";
import { sendEmail } from "../utils/emailSend.js";
import { getUserID, setResetToken, validateToken } from "../utils/store.js";

export const createAdmin = async (req, res) => {
  try {
    const { username, contact, password, email } = req.body;

    if (!username || !contact || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const isEmailExist = await Admin.findOne({ email });

    if (isEmailExist) {
      return res.status(400).json({
        success: false,
        message: "Email Already Exists!",
      });
    }
    const isContactExist = await Admin.findOne({ contact });

    if (isContactExist) {
      return res.status(400).json({
        success: false,
        message: "Contact Already Exists!",
      });
    }

    const hashedPassword = await hash(password, 10);

    const admin = await Admin.create({
      username,
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

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    const admin = await Admin.findOne({
      $or: [{ email: identifier }, { contact: identifier }],
    }).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isPasswordMatched = await compare(password, admin.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const adminData = admin.toObject();
    delete adminData.password;

    res.cookie("id", adminData._id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendEmail({
      to: "rathodmanthan374@gmail.com",
      subject: "Testing Email",
      type: "forgetPassword",
      data: {
        link: "https://google.com",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: adminData,
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const editAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, contact, email } = req.body;

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

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { contact }, { username }],
    });

    if (existingAdmin) {
      let message = "";

      if (existingAdmin.email === email) {
        message = "Email Already Exists!";
      } else if (existingAdmin.contact === contact) {
        message = "Contact Already Exists!";
      } else if (existingAdmin.username === username) {
        message = "Username Already Exists!";
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    admin.username = username;
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
    const { id } = req.params;

    let admin = null;

    if (id) {
      admin = await Admin.findById(id).select("-password");
    } else {
      admin = await Admin.find().select("-password");
    }

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

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const id = req.params.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    const admin = await Admin.findById(id).select("+password");

    const isPasswordMatched = await compare(oldPassword, admin.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "old password is Invalid",
      });
    }

    const hashedPassword = await hash(newPassword, 10);

    admin.password = hashedPassword;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error While Change Password :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Email not found",
      });
    }

    const resetToken = Math.random().toString(36).substring(2, 15);

    setResetToken({
      id: admin._id,
      token: resetToken,
      expiry: Date.now() + 3600,
    });

    await admin.save();

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      type: "forgetPassword",
      data: {
        link: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Reset link sent to your email",
    });
  } catch (error) {
    console.log("Error while forget password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const isTokenValid = validateToken(token);

    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Request For Reset Password!",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }
    const hashedPassword = await hash(password, 10);
    const adminId = getUserID();

    const admin = await Admin.findByIdAndUpdate(adminId, {
      password: hashedPassword,
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong, Please Try Later",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("Error while reset password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Please Try Later!",
    });
  }
};
