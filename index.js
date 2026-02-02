require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// routes
const userRoutes = require("./routes/user.route");
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const orderRoutes = require("./routes/order.route");
const analyticsRoutes = require("./routes/analytics.route");
const storeRoutes = require("./routes/store.route");
const authRoutes = require("./routes/auth.route");

const mongoUrl = process.env.MONGODB_URL;

const allowedOrigins = [
  "http://localhost:5173",
  "https://www.ajamart.store",
  process.env.FRONTEND_URL, 
  process.env.DASHBOARD_URL,
  "https://ajah-eight.vercel.app",
  "https://ajah-dashboard.vercel.app"
  // Production frontend
];

// middleware
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, Vercel health checks)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// JSON error guard
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON format",
      error: err.message,
    });
  }
  next();
});

// Mongo connection cache for serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUrl).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// attach DB per request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error("DB Connection Error:", e);
    res.status(500).json({
      message: "DB connection failed",
      error: e.message,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
    });
  }
});

// routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/auth", authRoutes);

// health
app.get("/", (req, res) => {
  res.json("API running");
});

// fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = app;
