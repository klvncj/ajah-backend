const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  getCategoryDetails,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

// Route to get all categories
router.get("/", getAllCategories);
// Route to create a new category
router.post("/", createCategory);
// Route to get category details by ID
router.get("/:id", getCategoryDetails);
// Route to update category details by ID
router.put("/:id", updateCategory);
// Route to delete category by ID
router.delete("/delete/:categoryId", deleteCategory);
module.exports = router;
