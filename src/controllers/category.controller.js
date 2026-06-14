import { Category } from "../models/category.model.js";
import { deleteImage, uploadImage } from "../utils/imageUpload.js";

export const addCategory = async (req, res) => {
  try {
    const { name, parentCategory } = req.body;
    const image = req.file;

    console.log("REQ FILES :", req.file);

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await Category.findOne({
      name: {
        $regex: new RegExp(`^${name.trim()}$`, "i"),
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");

    let uploadedImage = null;

    if (image) {
      uploadedImage = await uploadImage(image, "categories");
    }

    const category = await Category.create({
      name: name.trim(),
      parentCategory: parentCategory || null,
      image: uploadedImage?.url || null,
      imageFileId: uploadedImage?.fileId || null,
      slug,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error While Creating Category:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { name } = req.params;
    let categories = null;
    if (!name) {
      categories = await Category.find({});
    } else {
      categories = await Category.find({
        name: { $regex: name, $options: "i" },
      });
    }

    if (!categories) {
      return res
        .status(404)
        .json({ success: false, error: "No Categories Found" });
    }
    const totalCategories = categories.length;

    return res.status(200).json({
      success: true,
      message: "Category Fetched Successfully",
      categories,
      length: totalCategories,
    });
  } catch (error) {
    console.log("Error While Get Category : ", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Something Went Wrong",
    });
  }
};

export const editCategory = async (req, res) => {
  try {
    const { name, parentCategory, slug } = req.body;
    const { id } = req.params;
    const image = req.file;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category Not Found",
      });
    }

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory && !existingCategory._id.equals(category._id)) {
      return res.status(400).json({
        success: false,
        error: "Category With Same Slug Already Exists",
      });
    }

    if (image) {
      if (category.imageFileId) {
        await deleteImage(category.imageFileId);
      }

      const uploadedImage = await uploadImage(image, "categories");
      category.image = uploadedImage.url;
      category.imageFileId = uploadedImage.fileId;
    }

    category.name = name || category.name;
    category.parentCategory = parentCategory || category.parentCategory;
    category.slug = slug || category.slug;

    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: "Category Updated Successfully",
      updatedCategory,
    });
  } catch (error) {
    console.log("Error While Update Category : ", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Something Went Wrong",
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category Not Found",
      });
    }

    await deleteImage(category.imageFileId);

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category Deleted Successfully",
    });
  } catch (error) {
    console.log("Error While Delete Category : ", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Something Went Wrong",
    });
  }
};
