import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildCategoryFilter = ({ search, name, isActive, parentCategory }) => {
  const filter = {};

  const keyword = search || name;

  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword.trim()), "i");

    filter.$or = [{ name: regex }, { slug: regex }];
  }

  if (typeof isActive !== "undefined") {
    filter.isActive = isActive === "true";
  }

  if (parentCategory) {
    filter.parentCategory = parentCategory;
  }

  return filter;
};

const deleteCategoryRecursively = async (categoryId) => {
  const childCategories = await Category.find({
    parentCategory: categoryId,
  });

  for (const child of childCategories) {
    await deleteCategoryRecursively(child._id);
  }

  const category = await Category.findById(categoryId);

  if (!category) return;

  const publicId = getCloudinaryPublicIdFromUrl(category.image);

  if (publicId) {
    await deleteImage(publicId).catch((error) =>
      console.error("Category Image Delete Error:", error),
    );
  }

  await Category.findByIdAndDelete(categoryId);
};

export const addCategory = async (req, res) => {
  try {
    const { name, parentCategory } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const trimmedName = name.trim();
    const slug = generateSlug(trimmedName);

    const existingCategory = await Category.findOne({
      $or: [
        {
          name: {
            $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i"),
          },
        },
        { slug },
      ],
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with the same name already exists.",
      });
    }

    let validatedParent = null;

    if (parentCategory) {
      if (!isValidObjectId(parentCategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent category id.",
        });
      }

      const parent = await Category.findById(parentCategory);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found.",
        });
      }

      validatedParent = parent._id;
    }

    let imageUrl = null;

    if (req.file) {
      const uploadedImage = await uploadImage(req.file, "categories");

      if (!uploadedImage?.url) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed. Please try again.",
        });
      }

      imageUrl = uploadedImage.url;
    }

    const category = await Category.create({
      name: trimmedName,
      slug,
      image: imageUrl,
      parentCategory: validatedParent,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category already exists with the same name or slug.",
      });
    }

    return sendServerError(res, error, "Add Category Error");
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const {
      search,
      name,
      parentCategory,
      isActive,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const filter = buildCategoryFilter({
      search,
      name,
      parentCategory,
      isActive,
    });

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    if (sort === "name-asc") {
      sortOption = { name: 1 };
    }

    if (sort === "name-desc") {
      sortOption = { name: -1 };
    }

    const [categories, totalCategories] = await Promise.all([
      Category.find(filter)
        .populate("parentCategory", "name slug image")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber),

      Category.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: categories.length
        ? "Categories fetched successfully."
        : "No categories found.",

      categories,

      totalCategories,

      currentPage: pageNumber,

      totalPages: Math.ceil(totalCategories / limitNumber) || 1,

      limit: limitNumber,
    });
  } catch (error) {
    return sendServerError(res, error, "Get All Categories Error");
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id.",
      });
    }

    const category = await Category.findById(id).populate(
      "parentCategory",
      "name slug image isActive",
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const childCategories = await Category.find({
      parentCategory: category._id,
    })
      .select("name slug image isActive parentCategory createdAt updatedAt")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully.",
      category,
      childCategories,
      childCount: childCategories.length,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Category By Id Error");
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    })
      .select("_id name slug image parentCategory isActive")
      .sort({ name: 1 })
      .lean();

    const categoryMap = new Map();

    categories.forEach((category) => {
      categoryMap.set(category._id.toString(), {
        ...category,
        children: [],
      });
    });

    const tree = [];

    categories.forEach((category) => {
      const categoryId = category._id.toString();

      if (!category.parentCategory) {
        tree.push(categoryMap.get(categoryId));
        return;
      }

      const parentId = category.parentCategory.toString();

      const parentNode = categoryMap.get(parentId);

      if (parentNode) {
        parentNode.children.push(categoryMap.get(categoryId));
      } else {
        tree.push(categoryMap.get(categoryId));
      }
    });

    return res.status(200).json({
      success: true,
      message: "Category tree fetched successfully.",
      categories: tree,
      totalRootCategories: tree.length,
    });
  } catch (error) {
    return sendServerError(res, error, "Get Category Tree Error");
  }
};

export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, parentCategory, isActive } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (name?.trim()) {
      const trimmedName = name.trim();
      const generatedSlug = generateSlug(trimmedName);

      const duplicateCategory = await Category.findOne({
        _id: { $ne: category._id },
        $or: [
          {
            name: {
              $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i"),
            },
          },
          {
            slug: generatedSlug,
          },
        ],
      });

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          message: "Another category already exists with the same name.",
        });
      }

      category.name = trimmedName;
      category.slug = generatedSlug;
    }

    if (typeof parentCategory !== "undefined") {
      if (parentCategory && !isValidObjectId(parentCategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent category id.",
        });
      }

      if (
        parentCategory &&
        parentCategory.toString() === category._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "A category cannot be its own parent.",
        });
      }

      if (parentCategory) {
        const parent = await Category.findById(parentCategory);

        if (!parent) {
          return res.status(404).json({
            success: false,
            message: "Parent category not found.",
          });
        }

        let currentParent = parent.parentCategory;

        while (currentParent) {
          const parentNode = await Category.findById(currentParent);

          if (!parentNode) break;

          if (parentNode._id.toString() === category._id.toString()) {
            return res.status(400).json({
              success: false,
              message: "Circular category hierarchy detected.",
            });
          }

          currentParent = parentNode.parentCategory;
        }

        category.parentCategory = parent._id;
      } else {
        category.parentCategory = null;
      }
    }

    if (typeof isActive !== "undefined") {
      category.isActive = isActive === true || isActive === "true";
    }

    if (req.file) {
      const uploadedImage = await uploadImage(req.file, "categories");

      if (!uploadedImage?.url) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed.",
        });
      }

      const oldPublicId = getCloudinaryPublicIdFromUrl(category.image);

      if (oldPublicId) {
        await deleteImage(oldPublicId).catch((error) =>
          console.error("Old Category Image Delete Error:", error),
        );
      }

      category.image = uploadedImage.url;
    }

    await category.save();

    const updatedCategory = await Category.findById(category._id).populate(
      "parentCategory",
      "name slug image",
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category: updatedCategory,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category already exists.",
      });
    }

    return sendServerError(res, error, "Edit Category Error");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { isDeleteChild = false, isMakeChildParentNull = false } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const childCategories = await Category.find({
      parentCategory: category._id,
    });

    const hasChildren = childCategories.length > 0;

    if (hasChildren) {
      if (isDeleteChild) {
        for (const child of childCategories) {
          await deleteCategoryRecursively(child._id);
        }
      } else if (isMakeChildParentNull) {
        await Category.updateMany(
          {
            parentCategory: category._id,
          },
          {
            $set: {
              parentCategory: null,
            },
          },
        );
      } else {
        return res.status(400).json({
          success: false,
          message:
            "This category contains subcategories. Send isDeleteChild=true to delete them or isMakeChildParentNull=true to keep them.",
          childCount: childCategories.length,
        });
      }
    }

    const publicId = getCloudinaryPublicIdFromUrl(category.image);

    if (publicId) {
      await deleteImage(publicId).catch((error) =>
        console.error("Category Image Delete Error:", error),
      );
    }

    await Category.findByIdAndDelete(category._id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return sendServerError(res, error, "Delete Category Error");
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category id is required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    category.isActive = !category.isActive;

    await category.save();

    return res.status(200).json({
      success: true,
      message: category.isActive
        ? "Category activated successfully."
        : "Category deactivated successfully.",
      category,
    });
  } catch (error) {
    return sendServerError(res, error, "Toggle Category Status Error");
  }
};
