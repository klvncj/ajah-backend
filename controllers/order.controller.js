const OrderModel = require("../models/order.model");
const ProductModel = require("../models/product.model");
const crypto = require("crypto"); // for generating secure orderId

// Utility to generate a random, readable order number
function generateOrderId() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g., "5F3C1A"
  const timestamp = Date.now().toString().slice(-5); // last 5 digits of timestamp
  return `ORD-${timestamp}-${random}`; // e.g., ORD-12345-5F3C1A
}

exports.createOrder = async (req, res) => {
  try {
    const { user, products, status, shippingAddress, payment } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: "No products provided" });
    }

    let validUser = null;
    let finalShippingAddress = shippingAddress;

    /* ---------------- USER VALIDATION ---------------- */

    if (user) {
      validUser = await UserModel.findById(user);

      if (!validUser) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const hasSavedAddress =
        validUser.address &&
        validUser.state &&
        validUser.country &&
        validUser.email &&
        validUser.phone;

      // Use saved address ONLY if frontend did NOT send one
      if (!shippingAddress && hasSavedAddress) {
        finalShippingAddress = {
          fullName: validUser.name,
          email: validUser.email,
          phone: validUser.phone,
          address: validUser.address,
          state: validUser.state,
          country: validUser.country,
        };
      }
    }

    if (!finalShippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    /* ---------------- PRODUCT VALIDATION ---------------- */

    for (const item of products) {
      const productData = await ProductModel.findById(item.product);

      if (!productData) {
        return res.status(400).json({
          message: `Product not found: ${item.product}`,
        });
      }

      if (productData.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${productData.name}`,
        });
      }
    }

    /* ---------------- BUILD ORDER ITEMS ---------------- */

    const productsWithPrice = await Promise.all(
      products.map(async (item) => {
        const productData = await ProductModel.findById(item.product).select(
          "price",
        );

        if (item.quantity < 1) {
          throw new Error("Invalid quantity");
        }

        return {
          product: item.product,
          quantity: item.quantity,
          priceAtPurchase: productData.price,
          variation: item.variation || null,
        };
      }),
    );

    /* ---------------- TOTAL ---------------- */

    const totalAmount = productsWithPrice.reduce(
      (sum, item) => sum + item.quantity * item.priceAtPurchase,
      0,
    );

    /* ---------------- CREATE ORDER ---------------- */

    const newOrder = new OrderModel({
      orderId: generateOrderId(),
      user: validUser ? validUser._id : null,
      products: productsWithPrice,
      status: status || "pending",
      shippingAddress: finalShippingAddress,
      payment,
      totalAmount,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Order created successfully",
      orderId: savedOrder.orderId,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};

// Controller function to create a new order
// exports.createOrder = async (req, res) => {
//   try {
//     // Calculate totalAmount from products
//     const calculatedTotalAmount = req.body.products.reduce(
//       (sum, item) => sum + item.quantity * item.priceAtPurchase,
//       0
//     );
//     const { user, products, status, shippingAddress, payment , totalAmount  } = req.body;

//     const newOrder = new OrderModel({
//       user,
//       products,
//       status,
//       shippingAddress,
//       payment,
//       totalAmount : calculatedTotalAmount ,
//     });

//     const savedOrder = await newOrder.save();

//     res.status(201).json({
//       message: "Order created successfully",
//       orderId: savedOrder._id,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating order",
//       error: error.message,
//     });
//   }
// };

// Controller function to get order details by orderId

exports.getOrderByOrderId = async (req, res) => {
  try {
    const orderIdParam = req.params.orderId.trim(); // remove extra spaces

    // Case-insensitive search
    const order = await OrderModel.findOne({
      orderId: { $regex: new RegExp(`^${orderIdParam}$`, "i") },
    })
      .populate("products.product", "name price")
      .populate("user", "name email"); // optional, include user info

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const formattedOrder = {
      orderId: order.orderId,
      customer: order.user, // populated name/email
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      products: order.products.map((p) => ({
        name: p.product.name,
        price: p.product.price,
        quantity: p.quantity,
      })),
    };

    res.status(200).json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error fetching order details" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id).populate(
      "products.product", // use the actual field in your schema
      "name price",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const formattedOrder = {
      _id: order._id,
      customer: order.user,
      orderId: order.orderId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      products: order.products.map((p) => ({
        _id: p.product._id,
        name: p.product.name,
        price: p.product.price,
        quantity: p.quantity,
      })),
    };

    res.status(200).json(formattedOrder);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message,
    });
  }
};

// Controller function to update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Controller function to delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};

// Controller function to get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await OrderModel.find({ user: userId }) // correct field
      .populate("user", "name email") // optional
      .populate("products.product", "name price"); // correct path

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user orders",
      error: error.message,
    });
  }
};

// Controller function to get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find().populate(
      "products.product",
      "name price",
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching all orders",
      error: error.message,
    });
  }
};

////controller function to get latest 20 orders
exports.getLatestOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("products.product", "name price");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest orders",
      error: error.message,
    });
  }
};
