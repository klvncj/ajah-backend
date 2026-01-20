const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

exports.getAnalyticsData = async (req, res) => {
  try {
    const [users, products, orders, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      totalUsers: users,
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (e) {
    res.status(500).json({ message: "Analytics error", error: e.message });
  }
};

exports.getSalesData = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({ message: "Sales data error", error: e.message });
  }
};

exports.getTopSellingProducts = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const data = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate },
          status: { $ne: "cancelled" },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
          revenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.priceAtPurchase"],
            },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          productId: "$_id",
          name: "$product.name",
          image: "$product.image",
          currentPrice: "$product.price",
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({
      message: "Top products error",
      error: e.message,
    });
  }
};
