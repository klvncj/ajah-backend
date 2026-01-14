const express = require("express");
const router = require("express").Router();
const { createProduct, getProductDetails, updateProduct, deleteProduct, getAllProducts, getProductsByCategory, searchProductsByName, getProductsPaginated, getProductsByCategoryName, getAllActiveProducts, getLatestProducts } = require("../controllers/product.controller");
const { getTopSellingProducts } = require("../controllers/analytics.controller");

// Route to create a new product
router.post("/", createProduct);
// Route to update product details by ID
router.put("/:id", updateProduct);
// Route to delete product by ID
router.delete("/:id", deleteProduct);
// Route to get all products
router.get("/all", getAllProducts);
// Route to get all active products
router.get("/all/active", getAllActiveProducts);
// Route to search products by name
router.get("/search", searchProductsByName);
// Route to get products by category ID
router.get("/category/:categoryId", getProductsByCategory);
// Route to get products by category name
router.get("/category/name/:categoryName", getProductsByCategoryName);
// Route to get paginated products
router.get("/page", getProductsPaginated);
// Route to get product details by ID
router.get("/:id", getProductDetails);
// Route to get products on sale
router.get("/sale", getTopSellingProducts);
//route to get latest products
router.get("/latest", getLatestProducts)



module.exports = router;