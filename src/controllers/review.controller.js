import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import {
  uploadImage,
  deleteImage,
} from "../utils/imageUpload.js";

const sendServerError = (res, error, label) => {
  console.error(`${label}:`, error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong on our side. Please try again later.",
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const addReview = async (req, res) => {
  try {
    const { product, rating, review } = req.body;
    const customerId = req.user?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to leave a review.",
      });
    }

    if (!product || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product and rating (1-5) are required.",
      });
    }

    if (!isValidObjectId(product)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5.",
      });
    }

    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const existingReview = await Review.findOne({
      customer: customerId,
      product,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const uploadedImages = [];
    if (req.files?.length) {
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadImage(file, "reviews"))
      );

      uploadedImages.push(
        ...uploadResults.map((item) => ({
          url: item.url,
          fileId: item.fileId,
        }))
      );
    }

    const newReview = await Review.create({
      customer: customerId,
      product,
      rating: numericRating,
      review: review?.trim() || "",
      images: uploadedImages,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully.",
      review: newReview,
    });
  } catch (error) {
    return sendServerError(res, error, "Add Review Error");
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing product id.",
      });
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ product: productId })
        .populate("customer", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Review.countDocuments({ product: productId }),
    ]);

    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats[0]?.averageRating || 0;

    return res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      currentPage: pageNumber,
      totalPages: Math.ceil(totalReviews / limitNumber) || 1,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Product Reviews Error");
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const customerId = req.user?._id || req.params.customerId;
    const { page = 1, limit = 10 } = req.query;

    if (!customerId || !isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing customer id.",
      });
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ customer: customerId })
        .populate("product", "name slug images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Review.countDocuments({ customer: customerId }),
    ]);

    return res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalReviews / limitNumber) || 1,
    });
  } catch (error) {
    return sendServerError(res, error, "Get User Reviews Error");
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const customerId = req.user?._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review id.",
      });
    }

    const reviewDoc = await Review.findById(id);
    if (!reviewDoc) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (reviewDoc.customer.toString() !== customerId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this review.",
      });
    }

    if (rating) {
      const numericRating = Number(rating);
      if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be a number between 1 and 5.",
        });
      }
      reviewDoc.rating = numericRating;
    }

    if (typeof review !== "undefined") {
      reviewDoc.review = review.trim();
    }

    if (req.files?.length) {
      // Delete old review images
      for (const img of reviewDoc.images) {
        if (img.fileId) {
          await deleteImage(img.fileId).catch(console.error);
        }
      }

      // Upload new images
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadImage(file, "reviews"))
      );

      reviewDoc.images = uploadResults.map((item) => ({
        url: item.url,
        fileId: item.fileId,
      }));
    }

    await reviewDoc.save();

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review: reviewDoc,
    });
  } catch (error) {
    return sendServerError(res, error, "Update Review Error");
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review id.",
      });
    }

    const reviewDoc = await Review.findById(id);
    if (!reviewDoc) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    // Owner of review or admin can delete
    if (
      reviewDoc.customer.toString() !== userId?.toString() &&
      userRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review.",
      });
    }

    // Clean up images
    for (const img of reviewDoc.images) {
      if (img.fileId) {
        await deleteImage(img.fileId).catch(console.error);
      }
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    return sendServerError(res, error, "Delete Review Error");
  }
};
