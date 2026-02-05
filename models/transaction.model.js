const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
  ref: {
    type: String, // Paystack reference (should match Order ID)
    required: true,
    index: true,
  },
  orderId: {
    type: String, // Explicit link to our Order ID
    required: true,
  },
  amount: {
    type: Number, // Amount in kobo (or lowest currency unit) usually from Paystack
    required: true,
  },
  currency: {
    type: String,
    default: "NGN",
  },
  status: {
    type: String, // success, failed, abandoned, etc.
    required: true,
  },
  gateway_response: {
    type: String,
  },
  channel: {
    type: String, // card, bank, etc.
  },
  ip_address: {
    type: String,
  },
  log: {
    type: Object, // Store the full webhook payload for debugging
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
