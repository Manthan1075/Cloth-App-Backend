import Product from "../models/product.model.js";
import Banner from "../models/banner.model.js";
import Category from "../models/category.model.js";

export const getHeroSection = async (req, res) => {
  try {
    const [banners, categories, latestProducts] = await Promise.all([
      Banner.find({ isActive: true }),
      Category.find().limit(10),
      Product.find().sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: { banners, categories, latestProducts },
    });
  } catch (error) {
    console.error("Error in getHeroSection ::", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const addBanner = async (req, res) => {
  try {
    const { title, link } = req.body;
    const image = req.file.banner;
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required.",
      });
    }

    const newBanner = await Banner.create({ title, link, image });

    return res.status(201).json({
      success: true,
      message: "Banner added successfully.",
      data: newBanner,
    });
  } catch (error) {
    console.error("Error in addBanner ::", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add banner. Please try again.",
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteBanner ::", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete banner. Please try again.",
    });
  }
};

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({});

    return res.status(200).json({
      success: true,
      message: banners.length
        ? "Banners fetched successfully."
        : "No banners found.",
      data: banners,
    });
  } catch (error) {
    console.error("Error in getBanners ::", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banners. Please try again.",
    });
  }
};
