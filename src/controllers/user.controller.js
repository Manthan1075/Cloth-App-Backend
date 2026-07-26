import mongoose from "mongoose";
import { compare, hash } from "bcrypt";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";
import {
  uploadImage,
  deleteImage,
  getCloudinaryPublicIdFromUrl,
} from "../utils/imageUpload.js";
import { sendEmail } from "../utils/emailSend.js";
import {
  clearResetToken,
  getUserID,
  setResetToken,
  validateToken,
  validateOTP,
  setOTP,
} from "../utils/store.js";
import axios from 'axios';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendServerError = (res, error, label) => {
  console.error(`${label}:`, error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong on our side. Please try again later.",
  });
};

const sanitizeUser = (user) => {
  if (!user) return null;

  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const normalizeEmail = (email) => email?.trim().toLowerCase();

export const createUser = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "phone and otp number are required.",
      });
    }

    if (!validateOTP(phone, otp)) {
      return res.status(401).json({
        success: false,
        message: "OTP IS Invalid!"
      })
    }

    const existingUser = await User.findOne({ phone: phone.trim() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this phone number already exists. Please log in instead.",
      });
    }

    const user = await User.create({
      phone: phone.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: sanitizeUser(user),
    });

  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This phone number is already registered. Please use another number.",
      });
    }

    return sendServerError(res, error, "Create User Error");
  }
};

export const loginUser = async (req, res) => {
  try {
    const { phone, otp } = req.body;


    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "phone and otp number are required.",
      });
    }

    if (!validateOTP(phone, otp)) {
      return res.status(401).json({
        success: false,
        message: "OTP IS Invalid!"
      })
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account was found with this phone number. Please sign up first.",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. Please contact support for help.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error?.code?.startsWith?.("auth/")) {
      return res.status(401).json({
        success: false,
        message:
          "Your login token is invalid or expired. Please request a new OTP and try again.",
      });
    }

    return sendServerError(res, error, "Login User Error");
  }
};

export const sendOTPToPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const otpCode = generateOTP();

    setOTP({ otp: otpCode, phone: phone, expiry: Date.now() + 5 * 60 * 1000 });

    console.log("OTP :", otpCode);


    // const response = await axios.post(
    //   "https://mysmsgate.net/api/v1/send",
    //   {
    //     to: `${phone}`,
    //     message: `Hey I Am There`,
    //     device_id: process.env.SMS_DEVICE_ID,
    //     slot: 0,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.SMS_API_KEY}`,
    //       "Content-Type": "application/json"
    //     }
    //   }
    // );

    const response = {
      otp: otpCode,
      status: "sent"
    }

    console.log("RES :", response);


    return res.status(200).json({
      success: true,
      message: "OTP SENT SUCCESSFULLY",
      data: response.data
    });

  } catch (error) {
    console.error("Error sending OTP to phone:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error, Please Try Again",
    })
  }
}

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const finalEmail = normalizeEmail(email);

    if (!finalEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required for admin login.",
      });
    }

    const adminUser = await User.findOne({ email: finalEmail, role: "admin" });

    if (!adminUser || !adminUser.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    const isPasswordValid = await compare(password, adminUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    if (adminUser.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "This admin account is blocked. Please contact the owner.",
      });
    }

    adminUser.lastLogin = new Date();
    await adminUser.save();

    const token = generateToken(adminUser);

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      user: sanitizeUser(adminUser),
    });
  } catch (error) {
    return sendServerError(res, error, "Admin Login Error");
  }
};

export const editUser = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.id;
    const { name, email, address, city, state, pincode } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in before updating your profile.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please log in again and try once more.",
      });
    }

    const finalEmail = normalizeEmail(email);
    if (finalEmail && finalEmail !== user.email) {
      const emailOwner = await User.findOne({
        email: finalEmail,
        _id: { $ne: user._id },
      });

      if (emailOwner) {
        return res.status(409).json({
          success: false,
          message: "This email is already used by another account.",
        });
      }

      user.email = finalEmail;
    }

    if (name) user.name = name.trim();

    if (address || city || state || pincode) {
      user.address = {
        address: address ?? user.address?.address,
        city: city ?? user.address?.city,
        state: state ?? user.address?.state,
        pincode: pincode ?? user.address?.pincode,
      };
    }

    if (req.file) {
      const uploadedAvatar = await uploadImage(req.file, "user-avatar");

      if (!uploadedAvatar?.url) {
        return res.status(500).json({
          success: false,
          message: "Avatar upload failed. Please try again.",
        });
      }

      const oldAvatarId = getCloudinaryPublicIdFromUrl(user.avatar);
      if (oldAvatarId) {
        await deleteImage(oldAvatarId).catch((error) =>
          console.error("Old Avatar Delete Error:", error),
        );
      }

      user.avatar = uploadedAvatar.url;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "The updated details conflict with another account. Please check and try again.",
      });
    }

    return sendServerError(res, error, "Edit User Error");
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User id is required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      user,
    });
  } catch (error) {
    return sendServerError(res, error, "Get User Error");
  }
};

export const verifyPhoneForLogin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const user = await User.findOne({ phone: phone.trim() }).select(
      "_id status phone",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account exists with this phone number. Please sign up first.",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. Please contact support for help.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Phone number verified. You can send OTP now.",
    });
  } catch (error) {
    return sendServerError(res, error, "Verify Phone Error");
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const {
      name,
      search,
      phone,
      email,
      status,
      role,
      sort = "newest",
      date,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    const keyword = search || name;
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword.trim()), "i");
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    if (phone) filter.phone = new RegExp(escapeRegex(phone.trim()), "i");
    if (email) filter.email = new RegExp(escapeRegex(email.trim()), "i");
    if (status) filter.status = status;
    if (role) filter.role = role;

    if (date) {
      const [start, end] = date.split(",");
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      if (startDate && Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date. Please use YYYY-MM-DD format.",
        });
      }

      if (endDate && Number.isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date. Please use YYYY-MM-DD format.",
        });
      }

      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "name-asc") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: users.length
        ? "Users fetched successfully."
        : "No users found for the selected filters.",
      users,
      totalUsers,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalUsers / limitNumber) || 1,
      limit: limitNumber,
    });
  } catch (error) {
    return sendServerError(res, error, "Get All Users Error");
  }
};

export const toggleBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User id is required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const nextStatus = status === "active" ? "active" : "blocked";
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "admin" && nextStatus === "blocked") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be blocked from this user action.",
      });
    }

    user.status = nextStatus;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        nextStatus === "blocked"
          ? "User blocked successfully."
          : "User unblocked successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return sendServerError(res, error, "Block User Error");
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const finalEmail = normalizeEmail(email);

    if (!finalEmail || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, old password, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const adminUser = await User.findOne({ email: finalEmail, role: "admin" });

    if (!adminUser || !adminUser.password) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const isOldPasswordValid = await compare(oldPassword, adminUser.password);

    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    adminUser.password = await hash(newPassword, 10);
    await adminUser.save();

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully.",
    });
  } catch (error) {
    return sendServerError(res, error, "Change Admin Password Error");
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const finalEmail = normalizeEmail(email);

    if (!finalEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required to reset the password.",
      });
    }

    const adminUser = await User.findOne({ email: finalEmail, role: "admin" });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found with this email.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    setResetToken({
      id: adminUser._id,
      token: resetToken,
      expiry: Date.now() + 60 * 60 * 1000,
    });

    const resetredirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
    const emailResult = await sendEmail({
      to: finalEmail,
      subject: "Reset your CK Fashion admin password",
      type: "forgetPassword",
      data: {
        redirectUrl: resetredirectUrl,
      },
    });

    if (!emailResult.success) {
      clearResetToken();
      return res.status(500).json({
        success: false,
        message: "We could not send the reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset redirectUrl sent successfully. Please check your email.",
    });
  } catch (error) {
    return sendServerError(res, error, "Forget Password Error");
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    const isTokenValid = validateToken(resetToken);

    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset redirectUrl is invalid or expired. Please request a new one.",
      });
    }

    const adminId = getUserID();
    const adminUser = await User.findOne({ _id: adminId, role: "admin" });

    if (!adminUser) {
      clearResetToken();
      return res.status(404).json({
        success: false,
        message: "Admin account not found for this reset request.",
      });
    }

    adminUser.password = await hash(password, 10);
    await adminUser.save();
    clearResetToken();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with the new password.",
    });
  } catch (error) {
    return sendServerError(res, error, "Reset Password Error");
  }
};
