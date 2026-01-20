const mongoose = require("mongoose");
const orderController = require("./controllers/order.controller");
const User = require("./models/user.model");
const Product = require("./models/product.model");
const Order = require("./models/order.model");
const Category = require("./models/category.model");
require("dotenv").config();

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

let createdUser = null;
let createdCategory = null;
let createdProduct = null;
let createdOrderId = null;

async function runTest() {
  console.log("Connecting to DB...");
  if (!process.env.MONGODB_URL) {
    console.error("MONGODB_URL not found in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected.");

  try {
    // 1. Setup Data
    let user = await User.findOne({ email: "test_verify_order@example.com" });
    if (!user) {
      user = await User.create({
        name: "Test Verify Order",
        email: "test_verify_order@example.com",
        password: "password123",
        phone: "0000000000",
        address: "123 Test St",
        state: "TestState",
        country: "TestCountry",
      });
      createdUser = user;
      console.log("Created dummy user");
    }

    let category = await Category.findOne({ name: "TestCat" });
    if (!category) {
      // Try simple create, might fail if some validation, but seems standard
      category = await Category.create({ name: "TestCat" });
      createdCategory = category;
      console.log("Created dummy category");
    }

    let product = await Product.findOne({ name: "Test Product Verify" });
    if (!product) {
      product = await Product.create({
        name: "Test Product Verify",
        price: 100,
        stock: 100,
        category: category._id,
        description: "Test Desc",
      });
      createdProduct = product;
      console.log("Created dummy product");
    }

    // 2. Mock Request
    const shippingFee = 55;
    const req = {
      body: {
        user: user._id,
        products: [{ product: product._id, quantity: 2 }], // 2 * 100 = 200
        shippingFee: shippingFee,
        shippingAddress: {
          fullName: "Test Recipient",
          email: "recipient@example.com",
          phone: "1112223333",
          address: "456 Ship Lane",
          state: "ShipState",
          country: "ShipCountry",
        },
        payment: { method: "card" },
      },
    };

    const res = mockRes();

    // 3. Execute
    console.log("Calling createOrder...");
    await orderController.createOrder(req, res);

    if (res.statusCode !== 201) {
      console.error("Controller returned error status:", res.statusCode);
      console.error("Response:", res.data);
      throw new Error("Controller failed");
    }

    console.log("Order created. OrderId (custom):", res.data.orderId);

    // 4. Verify
    const order = await Order.findOne({ orderId: res.data.orderId });
    if (!order) {
      throw new Error("Order not found in DB");
    }
    createdOrderId = order._id; // for cleanup

    const expectedSubTotal = 200;
    const expectedTotal = 200 + shippingFee;

    console.log("--- Verification Results ---");
    console.log(`SubTotal: ${order.subTotal} (Expected: ${expectedSubTotal})`);
    console.log(`ShippingFee: ${order.shippingFee} (Expected: ${shippingFee})`);
    console.log(
      `TotalAmount: ${order.totalAmount} (Expected: ${expectedTotal})`,
    );

    if (
      order.subTotal === expectedSubTotal &&
      order.shippingFee === shippingFee &&
      order.totalAmount === expectedTotal
    ) {
      console.log("SUCCESS: All fields match expectatations.");
    } else {
      console.error("FAILURE: Fields do not match.");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Test Exception:", error);
    process.exitCode = 1;
  } finally {
    // 5. Cleanup
    console.log("Cleaning up...");
    if (createdOrderId) await Order.findByIdAndDelete(createdOrderId);
    if (createdProduct) await Product.findByIdAndDelete(createdProduct._id);
    if (createdCategory) await Category.findByIdAndDelete(createdCategory._id);
    if (createdUser) await User.findByIdAndDelete(createdUser._id);
    console.log("Cleanup done. Disconnecting...");
    await mongoose.disconnect();
  }
}

runTest();
