const express = require("express");
const router = express.Router();
const {
  createOrder,
  checkout,
  verifyCheckout,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders,
  getOrderByOrderId,
  getLatestOrders,
  getUserOrders,
  getOrderbyOrderId,
  deleteOrder,
} = require("../controllers/order.controller");
// Route to create a new order (handles both online card payment and COD)
router.post("/", checkout, verifyCheckout, createOrder);
// Route to get all orders
router.get("/", getAllOrders);
// Route to get order details by ID
router.get("/details/:id", getOrderDetails);
// Route to get order details by orderId
router.get("/details/user/:orderId", getOrderbyOrderId);
// Route to update order status by ID
router.put("/:id/status", updateOrderStatus);
// Route to get latest 20 orders
router.get("/latest", getLatestOrders);
// Route to get user orders
router.get("/user/:userId", getUserOrders);
// Route to delete order
router.delete("/:id", deleteOrder);

module.exports = router;
