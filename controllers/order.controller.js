const OrderModel = require("../models/order.model");
const ProductModel = require("../models/product.model");
const userModel = require("../models/user.model");
const TransactionModel = require("../models/transaction");
const {
  generatePaymentLink,
  verifyPayment,
} = require("../utility/flutterwave");
const { sendEmail, getStatusEmailHtml } = require("../utility/mailer");
const { finalizeOrder } = require("../utility/order.service");

// Checkout middleware
exports.checkout = async (req, res, next) => {
  try {
    const { user, products, shippingAddress, payment, shippingFee } = req.body;

    // Only handle if card payment and no transaction ID (initialization)
    if (payment?.method !== "card" || req.body.transaction_id) {
      return next();
    }

    if (!products || !products.length) {
      return res.status(400).json({ message: "No products provided" });
    }

    let validUser = null;
    let finalShippingAddress = shippingAddress;

    if (user) {
      validUser = await userModel.findById(user);
      if (!validUser) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const hasSavedAddress =
        validUser.address &&
        validUser.state &&
        validUser.country &&
        validUser.email &&
        validUser.phone;

      if (!shippingAddress && hasSavedAddress) {
        finalShippingAddress = {
          fullName: validUser.name,
          email: validUser.email,
          phone: validUser.phone,
          address: validUser.address,
          state: validUser.state,
          country: validUser.country,
        };
      }
    }

    if (!finalShippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    for (const item of products) {
      const productData = await ProductModel.findById(item.product);
      if (!productData) {
        return res
          .status(400)
          .json({ message: `Product not found: ${item.product}` });
      }
      if (productData.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${productData.name}`,
        });
      }
    }

    const productsWithPrice = await Promise.all(
      products.map(async (item) => {
        const productData = await ProductModel.findById(item.product).select(
          "name price",
        );
        if (!productData) throw new Error("Product not found");
        return {
          product: productData._id,
          productName: productData.name,
          quantity: item.quantity,
          priceAtPurchase: productData.price,
          variation: item.variation || null,
        };
      }),
    );

    const subTotal = productsWithPrice.reduce(
      (sum, item) => sum + item.quantity * item.priceAtPurchase,
      0,
    );
    const totalAmount = subTotal + (shippingFee || 0);

    const tx_ref = `txn_${Date.now()}_${user || "guest"}`;

    await TransactionModel.create({
      tx_ref,
      orderData: {
        user: validUser ? validUser._id : null,
        products: productsWithPrice,
        shippingAddress: finalShippingAddress,
        subTotal,
        shippingFee: shippingFee || 0,
        totalAmount,
      },
    });

    const paymentLink = await generatePaymentLink({
      amount: totalAmount,
      currency: "NGN",
      email: finalShippingAddress.email,
      name: finalShippingAddress.fullName,
      tx_ref,
      redirect_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/checkout/verify?tx_ref=${tx_ref}`,
    });

    return res.status(200).json({
      message: "Payment link generated",
      link: paymentLink.link,
      tx_ref,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({
      message: "Error during checkout initialization",
      error: error.message,
    });
  }
};

// Verify checkout middleware
exports.verifyCheckout = async (req, res, next) => {
  try {
    const { transaction_id } = req.body;
    if (!transaction_id) return next();

    const verificationData = await verifyPayment(transaction_id);
    if (!verificationData || verificationData.status !== "successful") {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const transactionRecord = await TransactionModel.findOne({
      tx_ref: verificationData.tx_ref,
    });

    if (!transactionRecord) {
      return res.status(404).json({ message: "Transaction record not found" });
    }

    if (transactionRecord.status === "successful") {
      // If webhook already processed it, return early but positively
      return res.status(200).json({
        message: "Order already processed",
        orderId: "PROCESSED" // Handled by createOrder usually, but here for safety
      });
    }

    req.body = {
      ...transactionRecord.orderData,
      payment: {
        method: "card",
        transactionId: transaction_id,
        paid: true,
      },
      tx_ref: verificationData.tx_ref,
    };
    next();
  } catch (error) {
    console.error("Verify Checkout Error:", error);
    res.status(500).json({
      message: "Error during payment verification",
      error: error.message,
    });
  }
};

// Order creation controller
exports.createOrder = async (req, res) => {
  try {
    const { user, products, shippingAddress, payment, shippingFee, tx_ref } =
      req.body;

    const result = await finalizeOrder({
      orderData: { user, products, shippingAddress, shippingFee },
      paymentData: payment,
      tx_ref,
    });

    if (result.alreadyProcessed) {
      return res.status(200).json({
        message: "Order already processed",
        orderId: result.orderId,
      });
    }

    res.status(201).json({
      message: "Order created successfully",
      orderId: result.orderId,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};

exports.getOrderbyOrderId = async (req, res) => {
  const OrderId = req.params.orderId;
  try {
    const order = await OrderModel.findOne({ orderId: OrderId }).populate(
      "products.product",
      "name price images variation",
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const formattedOrder = {
      _id: order._id,
      customer: order.user,
      orderId: order.orderId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      payment: order.payment,
      subTotal: order.subTotal,
      shippingFee: order.shippingFee,
      products: order.products.map((p) => ({
        _id: p.product._id,
        name: p.product.name,
        price: p.product.price,
        quantity: p.quantity,
      })),
    };
    res.status(200).json(formattedOrder);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message,
    });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id).populate(
      "products.product",
      "name price images variation",
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const formattedOrder = {
      _id: order._id,
      customer: order.user,
      orderId: order.orderId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      payment: order.payment,
      subTotal: order.subTotal,
      shippingFee: order.shippingFee,
      shippingAddress: order.shippingAddress,
      products: order.products.map((p) => ({
        _id: p.product._id,
        name: p.product.name,
        price: p.product.price,
        quantity: p.quantity,
      })),
    };
    res.status(200).json(formattedOrder);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === status) return res.status(200).json({ message: "Status unchanged", order });

    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();
    const updatedOrder = await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });

    if (order.shippingAddress?.email) {
      const html = getStatusEmailHtml(updatedOrder, previousStatus);
      sendEmail({
        to: order.shippingAddress.email,
        subject: `Order #${order.orderId} status updated`,
        text: `Your order status changed from ${previousStatus} to ${status}.`,
        html,
      }).catch((err) => console.error("Order status email failed:", err));
    }
  } catch (error) {
    res.status(500).json({
      message: "Error updating order status",
      error: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await OrderModel.find({ user: userId })
      .populate("user", "name email")
      .populate("products.product", "name price images");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user orders",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find().populate("products.product", "name price");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching all orders",
      error: error.message,
    });
  }
};

exports.getLatestOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find().sort({ createdAt: -1 }).limit(20).populate("products.product", "name price");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest orders",
      error: error.message,
    });
  }
};
