const Transaction = require("../models/transaction.model");

// Get all transactions (for admin monitoring)
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      transactions,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

// Get single transaction by ref
exports.getTransactionByRef = async (req, res) => {
  try {
    const { ref } = req.params;
    const transaction = await Transaction.findOne({ ref });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching transaction",
      error: error.message,
    });
  }
};
