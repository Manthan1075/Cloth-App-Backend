import { Product } from "../models/product.model.js";
import { uploadImage, deleteImage } from "../utils/imageUpload.js";
import mongoose from "mongoose";

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      description,
      stock,
      size,
      gender,
      color,
      keyword,
    } = req.body;

    const images = req.files;

    if (!name || !price || !description || !stock) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let uploadedImages = [];

    if (images && images.length > 0) {
      const uploadPromises = images.map((img) => uploadImage(img, "Product"));

      const results = await Promise.all(uploadPromises);

      uploadedImages = results.map((r) => ({
        url: r.url,
        fileId: r.fileId,
      }));
    }

    const newProduct = await Product.create({
      name,
      price,
      category,
      description,
      stock,
      size,
      gender,
      color,
      keyword,
      images: uploadedImages,
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.log("Error Occur While Adding Product ::", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { category, keyword, size, price, gender, page, limit, sort, date } =
      req.query;

    let filter = {};

    if (keyword) {
      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { name: regex },
        { description: regex },
        { keywords: regex },
      ];
    }

    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    if (gender) {
      filter.gender = gender;
    }

    if (size) {
      const sizeArray = Array.isArray(size) ? size : size.split(",");
      filter.size = { $in: sizeArray };
    }

    if (price) {
      const [min, max] = price.split(",").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max };
      }
    }

    if (date) {
      const [start, end] = date.split(",");
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: new Date(start),
        $lte: endDate,
      };
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };

    const [products, totalProducts] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNumber),
      Product.countDocuments(filter),
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found!",
      });
    }

    return res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      totalProducts,
    });
  } catch (error) {
    console.error("Error occurred while fetching products ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      category,
      description,
      stock,
      size,
      gender,
      color,
      keyword,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (size !== undefined) updateData.size = size;
    if (gender !== undefined) updateData.gender = gender;
    if (color !== undefined) updateData.color = color;
    if (keyword !== undefined) updateData.keyword = keyword;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.log("Error Occur While Updating Product ::", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((img) =>
        deleteImage(img.fileId),
      );

      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product and images deleted successfully",
    });
  } catch (error) {
    console.log("Error Occur While Deleting Product ::", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.log("Error Occur While Get Product By Id :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
