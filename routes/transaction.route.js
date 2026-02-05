const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");

// Add auth middleware here if needed (e.g., admin only)
// const { protect, admin } = require("../middleware/auth.middleware");

router.get("/", transactionController.getAllTransactions);
router.get("/:ref", transactionController.getTransactionByRef);

module.exports = router;
