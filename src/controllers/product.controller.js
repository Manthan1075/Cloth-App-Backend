import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { ProductVariant } from "../models/productVariant.model.js";
import {
  uploadImage,
  deleteImage,
  getCloudinaryPublicIdFromUrl,
} from "../utils/imageUpload.js";
import { Review } from "../models/review.model.js";

const sendServerError = (res, error, label) => {
  console.error(`${label}:`, error);

  return res.status(500).json({
    success: false,
    message:
      "Something went wrong on our side. Please try again later.",
  });
};

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      genders,
      fabric,
      description,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id.",
      });
    }

    const categoryExists =
      await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const slug = generateSlug(name);

    const existingProduct =
      await Product.findOne({
        slug,
      });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message:
          "Product already exists with the same name.",
      });
    }

    const uploadedImages = [];

    if (req.files?.length) {
      const uploadResults =
        await Promise.all(
          req.files.map((file) =>
            uploadImage(file, "products")
          )
        );

      uploadedImages.push({
        color: "default",
        urls: uploadResults.map(
          (item) => item.url
        ),
      });
    }

    const product =
      await Product.create({
        name: name.trim(),
        slug,
        category,
        genders,
        fabric,
        description,
        images: uploadedImages,
      });

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      product,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Create Product Error"
    );
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      gender,
      isAvailable,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const filter = {};

    if (search) {
      const regex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { name: regex },
        { description: regex },
      ];
    }

    if ( // REMOVE IN FUTURE IF NOT USEFULL ...
      category &&
      isValidObjectId(category)
    ) {
      filter.category = category;
    }

    if (gender) {
      filter.genders = gender;
    }

    if (
      typeof isAvailable !==
      "undefined"
    ) {
      filter.isAvailable =
        isAvailable === "true";
    }

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "oldest")
      sortOption = {
        createdAt: 1,
      };

    if (sort === "name-asc")
      sortOption = {
        name: 1,
      };

    if (sort === "name-desc")
      sortOption = {
        name: -1,
      };

    const [products, totalProducts] =
      await Promise.all([
        Product.find(filter)
          .populate(
            "category",
            "name slug"
          )
          .sort(sortOption)
          .skip(skip)
          .limit(limitNumber),

        Product.countDocuments(
          filter
        ),
      ]);

    return res.status(200).json({
      success: true,
      products,
      totalProducts,
      currentPage:
        pageNumber,
      totalPages:
        Math.ceil(
          totalProducts /
          limitNumber
        ) || 1,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Get Products Error"
    );
  }
};


export const getProductById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product id.",
      });
    }

    const product =
      await Product.findById(id)
        .populate(
          "category",
          "name slug"
        );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });

    const variants =
      await ProductVariant.find({
        product: product._id,
      });

    return res.status(200).json({
      success: true,
      product,
      variants,
      reviews
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Get Product By Id Error"
    );
  }
};

export const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      genders,
      fabric,
      description,
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product id.",
      });
    }

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    if (name?.trim()) {
      product.name =
        name.trim();

      product.slug =
        generateSlug(name);
    }

    if (category) {
      product.category =
        category;
    }

    if (genders)
      product.genders =
        genders;

    if (fabric !== undefined)
      product.fabric =
        fabric;

    if (
      description !== undefined
    )
      product.description =
        description;

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully.",
      product,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Update Product Error"
    );
  }
};

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product id.",
      });
    }

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const variants = await ProductVariant.find({
      product: product._id,
    });

    const imageDeletionPromises = [];

    for (const variant of variants) {
      if (variant.coverImage) {
        const publicId =
          getCloudinaryPublicIdFromUrl(
            variant.coverImage
          );
        if (publicId) {
          imageDeletionPromises.push(
            deleteImage(publicId).catch(
              console.error
            )
          );
        }
      }

      if (
        variant.images &&
        variant.images.length > 0
      ) {
        for (const imgUrl of variant.images) {
          const publicId =
            getCloudinaryPublicIdFromUrl(
              imgUrl
            );
          if (publicId) {
            imageDeletionPromises.push(
              deleteImage(publicId).catch(
                console.error
              )
            );
          }
        }
      }
    }

    if (imageDeletionPromises.length > 0) {
      await Promise.all(
        imageDeletionPromises
      );
    }

    await ProductVariant.deleteMany({
      product: product._id,
    });

    await Product.findByIdAndDelete(
      product._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Delete Product Error"
    );
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const { id } =
      req.params;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product id.",
      });
    }

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    product.isAvailable =
      !product.isAvailable;

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Product status updated successfully.",
      product,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "Toggle Product Status Error"
    );
  }
};