const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
    tx_ref: {
        type: String,
        required: true,
        unique: true,
    },
    orderData: {
        type: Object,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "successful", "failed"],
        default: "pending",
    },
    flw_ref: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // Automatically delete after 1 hour if not processed
    },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
