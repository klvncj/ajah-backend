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

exports.getStoreAnalytics = async (req, res) => {
  try {
    const { storeId } = req.params;

    const [products, orders, revenueAgg] = await Promise.all([
      Product.countDocuments({ store: storeId }),
      Order.countDocuments({ store: storeId }),
      Order.aggregate([
        { $match: { store: storeId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (e) {
    res.status(500).json({ message: "Store analytics error", error: e.message });
  }
};

exports.getStoreSalesData = async (req, res) => {
  try {
    const { storeId } = req.params;

    const data = await Order.aggregate([
      { $match: { store: storeId, status: "completed" } },
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
    res.status(500).json({ message: "Store sales data error", error: e.message });
  }
};

exports.getStoreTopSellingProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30 } = req.query;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const data = await Order.aggregate([
      {
        $match: {
          store: storeId,
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
      message: "Store top products error",
      error: e.message,
    });
  }
};


exports.getStoreOrderStats = async (req, res) => {
  try {
    const { storeId } = req.params;

    const stats = await Order.aggregate([
      { $match: { store: storeId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      pending: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((s) => {
      result[s._id] = s.count;
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      message: "Store order stats error",
      error: e.message,
    });
  }
};

exports.getStoreRevenueByMonth = async (req, res) => {
  try {
    const { storeId } = req.params;

    const data = await Order.aggregate([
      { $match: { store: storeId, status: "completed" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({
      message: "Store revenue by month error",
      error: e.message,
    });
  }
};

exports.getStoreProductStats = async (req, res) => {
  try {
    const { storeId } = req.params;

    const stats = await Product.aggregate([
      { $match: { store: storeId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      active: 0,
      inactive: 0,
    };

    stats.forEach((s) => {
      result[s._id] = s.count;
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      message: "Store product stats error",
      error: e.message,
    });
  }
};

exports.getStoreSalesTrend = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30 } = req.query;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const data = await Order.aggregate([
      {
        $match: {
          store: storeId,
          createdAt: { $gte: fromDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({
      message: "Store sales trend error",
      error: e.message,
    });
  }
};

exports.getStoreOrderTrend = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30 } = req.query;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const data = await Order.aggregate([
      {
        $match: {
          store: storeId,
          createdAt: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({
      message: "Store order trend error",
      error: e.message,
    });
  }
};

