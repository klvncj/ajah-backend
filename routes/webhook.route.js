const express = require("express");
const router = express.Router();
const { flutterwaveWebhook } = require("../controllers/webhook.controller");

// Flutterwave Webhook Route
router.post("/flutterwave", flutterwaveWebhook);

module.exports = router;
