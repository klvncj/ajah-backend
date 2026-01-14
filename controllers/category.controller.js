const CategoryModel = require("../models/category.model");
const slugify = require("slugify");

// Controller function to get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

// Controller function to create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, url, isActive } = req.body;
    //Convert name to slug and assign to url field if url is not provided
    if (!url) {
      req.body.url = slugify(name, { lower: true, strict: true });
    }
    const newCategory = new CategoryModel({ name, description, url, isActive });
    const savedCategory = await newCategory.save();
    res.status(201).json({
      message: "Category created successfully",
      categoryId: savedCategory._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

// Controller function to get category details
exports.getCategoryDetails = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching category details",
      error: error.message,
    });
  }
};

// Controller function to update category details
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updates = req.body;
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      categoryId,
      updates,
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating category",
      error: error.message,
    });
  }
};

// Controller function to delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({
      message: "Category deleted successfully",
      category: deletedCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// Controller function to toggle category active status
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    category.isActive = !category.isActive;
    const updatedCategory = await category.save();
    res.status(200).json({
      message: "Category status toggled successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error toggling category status",
      error: error.message,
    });
  } 
};
