require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const mongoUrl = process.env.MONGODB_URL;
// routes import
const userRoutes = require("./routes/user.route");
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const orderRoutes = require("./routes/order.route");
const analyticsRoutes = require("./routes/analytics.route");
const authRoutes = require("./routes/auth.route");

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: Not allowed by policy"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("JSON Syntax Error:", err.message);
    console.error("Invalid Body:", err.body); // Log the body to see what's wrong
    return res
      .status(400)
      .json({ message: "Invalid JSON format", error: err.message });
  }
  next();
});

const connectionState = mongoose.connection.readyState;

if (connectionState === 1) {
  console.log("MongoDB is already connected");
} else {
  // connect to DB
  mongoose
    .connect(mongoUrl)
    .then(() => {
      app.listen(PORT, () => {
        console.log(`listening on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}

// routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);

// api listening
app.get("/", (req, res) => {
  res.json("Api is running.....");
});

// catch-all route
app.use((req, res) => {
  res.status(400).send("Route not found");
});
