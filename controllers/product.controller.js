const productModel = require("../models/product.model");
const categoryModel = require("../models/category.model");
const uploadToCloudinary = require("../utility/cloudinaryUpload");

// Controller function to create a new product
exports.createProduct = async (req, res) => {
  try {
    let {
      name,
      description,
      price,
      category,
      stock,
      variations,
      unit,
      shortDescription,
      sizeChart,
    } = req.body;

    if (typeof variations === "string") {
      variations = JSON.parse(variations);
    }

    const files = req.files;

    const uploadedImages = [];

    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer);
      uploadedImages.push(result.secure_url);
    }

    const newProduct = new productModel({
      name,
      description,
      price,
      category,
      stock,
      variations, // NOW ARRAY
      unit,
      shortDescription,
      sizeChart,
      images: uploadedImages,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      productId: savedProduct._id,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};


// Controller function to get product details
exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productModel
      .findById(id)
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const formatted = {
      ...product._doc,
      category: product.category.name
    };

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product details",
      error: error.message
    });
  }
};

// Controller function to update product details
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedUpdates = {
      name: req.body.name,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      category: req.body.category,
      stock: req.body.stock,
      unit: req.body.unit,
      price: req.body.price,
      status: req.body.status,
    };

    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};


// Controller function to delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await productModel.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

// Controller function to get all products
exports.getAllProducts = async (req, res) => {
  try {
    console.log("Fetching all products...");
    const products = await productModel.find().populate("category", "name");

    const formatted = products.map((p) => ({
      ...p._doc,
      category: p.category.name,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("GET ALL PRODUCTS ERROR:", error);
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Controller function to get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.categoryId;
    const products = await productModel.find({ category });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

exports.getProductsByCategoryName = async (req, res) => {
  try {
    const categoryName = req.params.categoryName;

    // Find the category by name first
    const category = await categoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Use the category _id to find products
    const products = await productModel.find({ category: category._id });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products by category name",
      error: error.message,
    });
  }
};

// Controller function to search products by name with partial matching
exports.searchProductsByName = async (req, res) => {
  try {
    const nameQuery = req.query.name;
    const products = await productModel.find({
      name: { $regex: nameQuery, $options: "i" },
    });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

// Controller function to filter products by price range
exports.filterProductsByPriceRange = async (req, res) => {
  try {
    const { min, max } = req.query;
    const products = await productModel.find({
      price: { $gte: Number(min), $lte: Number(max) },
    });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error filtering products", error: error.message });
  }
};
// Controller function to get products that are low in stock
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold || 5;
    const products = await productModel.find({
      stock: { $lte: Number(threshold) },
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};
// Controller function to update stock quantity of a product
exports.updateProductStock = async (req, res) => {
  try {
    const productId = req.params.id;
    const { stock } = req.body;
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { stock },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product stock updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product stock", error: error.message });
  }
};

// Controller function to get products with specific variation
exports.getProductsByVariation = async (req, res) => {
  try {
    const variation = req.params.variation;
    const products = await productModel.find({ variations: variation });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products by variation",
      error: error.message,
    });
  }
};
// Controller function to get products sorted by price
exports.getProductsSortedByPrice = async (req, res) => {
  try {
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const products = await productModel.find().sort({ price: sortOrder });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching sorted products",
      error: error.message,
    });
  }
};
// Controller function to get products with pagination
exports.getProductsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const products = await productModel.find().skip(skip).limit(limit);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching paginated products",
      error: error.message,
    });
  }
};

exports.getAllActiveProducts = async (req, res) => {
  try {
    const products = await productModel.find({ status: "active" });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching active products",
      error: error.message,
    });
  }
};
// Controller function to deactivate a product
exports.deactivateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { status: "inactive" },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product deactivated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deactivating product", error: error.message });
  }
};

//controller function to get latest 20 products
exports.getLatestProducts = async (req, res) => {
  try {
    const products = await productModel
      .find()
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const formatted = products.map((p) => ({
      ...p._doc,
      category: p.category.name,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest products",
      error: error.message,
    });
  }
};
