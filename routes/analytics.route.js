const express = require("express");
const router = express.Router();
const {getAnalyticsData , getSalesData , getTopSellingProducts , } = require("../controllers/analytics.controller");

// Route to get analytics data
router.get("/data", getAnalyticsData);
// Route to get sales data over time
router.get("/sales", getSalesData);
// Route to get top selling products
router.get("/top-products", getTopSellingProducts);

module.exports = router;