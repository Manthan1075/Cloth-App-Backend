import mongoose from "mongoose";
import { Banner } from "../models/banner.model.js";
import {
  uploadImage,
  deleteImage,
  getCloudinaryPublicIdFromUrl,
} from "../utils/imageUpload.js";

const sendServerError = (res, error, label) => {
  console.error(`${label}:`, error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong on our side. Please try again later.",
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getHeroSection = async (req, res) => {
  try {
    const [banners, categories, latestProducts] = await Promise.all([
      Banner.find({ isActive: true }).sort({ createdAt: -1 }).lean(),

      Category.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name slug image")
        .lean(),

      Product.find({
        isAvailable: true,
      })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Hero section fetched successfully.",

      data: {
        banners,
        categories,
        latestProducts,
      },

      counts: {
        banners: banners.length,
        categories: categories.length,
        latestProducts: latestProducts.length,
      },
    });
  } catch (error) {
    console.error("Get Hero Section Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong on our side. Please try again later.",
    });
  }
};

export const addBanner = async (req, res) => {
  try {
    const { title, redirectUrl } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required.",
      });
    }

    const uploadedImage = await uploadImage(req.file, "banners");

    if (!uploadedImage?.url) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed.",
      });
    }

    const banner = await Banner.create({
      title: title?.trim() || "",
      redirectUrl: redirectUrl?.trim() || "",
      image: uploadedImage.url,
    });

    return res.status(201).json({
      success: true,
      message: "Banner created successfully.",
      banner,
    });
  } catch (error) {
    return sendServerError(res, error, "Add Banner Error");
  }
};

export const getBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    if (typeof isActive !== "undefined") {
      filter.isActive = isActive === "true";
    }

    const [banners, totalBanners] = await Promise.all([
      Banner.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Banner.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      banners,
      totalBanners,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalBanners / limitNumber) || 1,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Banners Error");
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner id.",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    return res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Banner By Id Error");
  }
};

export const editBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner id.",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    const { title, redirectUrl } = req.body;

    if (req.file) {
      const uploadedImage = await uploadImage(req.file, "banners");

      const publicId = getCloudinaryPublicIdFromUrl(banner.image);

      if (publicId) {
        await deleteImage(publicId).catch(console.error);
      }

      banner.image = uploadedImage.url;
    }

    if (typeof title !== "undefined") {
      banner.title = title.trim();
    }

    if (typeof redirectUrl !== "undefined") {
      banner.redirectUrl = redirectUrl.trim();
    }

    await banner.save();

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully.",
      banner,
    });
  } catch (error) {
    return sendServerError(res, error, "Edit Banner Error");
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner id.",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    const publicId = getCloudinaryPublicIdFromUrl(banner.image);

    if (publicId) {
      await deleteImage(publicId).catch(console.error);
    }

    await Banner.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    return sendServerError(res, error, "Delete Banner Error");
  }
};

export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner id.",
      });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    banner.isActive = !banner.isActive;

    await banner.save();

    return res.status(200).json({
      success: true,
      message: "Banner status updated successfully.",
      banner,
    });
  } catch (error) {
    return sendServerError(res, error, "Toggle Banner Status Error");
  }
};
