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
const authRoutes = require("./routes/auth.route");

const mongoUrl = process.env.MONGODB_URL;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

// middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    credentials: true,
  })
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
    cached.promise = mongoose
      .connect(mongoUrl)
      .then((mongoose) => mongoose);
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
    res.status(500).json({ message: "DB connection failed" });
  }
});

// routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);

// health
app.get("/", (req, res) => {
  res.json("API running");
});

// fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
