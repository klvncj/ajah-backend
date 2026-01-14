const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderDetails,
  updateOrderStatus,
    getAllOrders,
    getOrderByOrderId,
    getLatestOrders,
} = require("../controllers/order.controller");
// Route to create a new order
router.post("/", createOrder);
// Route to get all orders
router.get("/", getAllOrders);
// Route to get order details by ID
router.get("/details/:id", getOrderDetails);
// Route to get order details by orderId
router.get("/details/user/:orderId", getOrderByOrderId);
// Route to update order status by ID
router.put("/:id/status", updateOrderStatus);
// Route to get latest 20 orders
router.get("/latest", getLatestOrders);

module.exports = router;
