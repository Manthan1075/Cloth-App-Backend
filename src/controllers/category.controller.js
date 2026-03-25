import { Category } from "../models/category.model.js";

export const addCategory = async (req, res) => {
  try {
    const { name, parentCategory } = req.body;

    if (!name) {
      return res
        .status(404)
        .json({ success: false, error: "Category name is required" });
    }

    const slug =
      name.split(" ").join("-").toLowerCase() +
      Math.floor(Math.random() * 1000);
    const existingCategory = await Category.findOne({ slug });

    if (existingCategory) {
      return res
        .status(404)
        .json({ success: false, error: "Category already exists" });
    }

    const category = await Category.create({
      name,
      parentCategory,
      slug,
    });

    if (!category) {
      return res.status(500).json({
        success: false,
        message: "Failed To Create Category",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category Successfully Created",
    });
  } catch (error) {
    console.log("Error While Create Category :", error);

    return res
      .status(500)
      .json({ success: false, error: error.message || "Something Went Wrong" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { name } = req.body;
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
    if (!name || !slug) {
      return res.status(404).json({
        success: false,
        error: "Name and Slug is required",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category Not Found",
      });
    }

    category.name = name;
    category.parentCategory = parentCategory;
    category.slug = slug;

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory && !existingCategory._id.equals(category._id)) {
      return res.status(400).json({
        success: false,
        error: "Category With Same Slug Already Exists",
      });
    }

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
