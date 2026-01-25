const OrderModel = require("../models/order.model");
const ProductModel = require("../models/product.model");
const crypto = require("crypto"); // for generating secure orderId
const userModel = require("../models/user.model");
const sendEmail = require("../utility/mailer");

// Utility to generate a random, readable order number
function generateOrderId() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g., "5F3C1A"
  const timestamp = Date.now().toString().slice(-5); // last 5 digits of timestamp
  return `ORD-${timestamp}-${random}`; // e.g., ORD-12345-5F3C1A
}

// Order creation controller
// exports.createOrder = async (req, res) => {
//   try {
//     const { user, products, status, shippingAddress, payment, shippingFee } =
//       req.body;

//     if (!products || !products.length) {
//       return res.status(400).json({ message: "No products provided" });
//     }

//     let validUser = null;
//     let finalShippingAddress = shippingAddress;

//     /* ---------------- USER VALIDATION ---------------- */

//     if (user) {
//       validUser = await userModel.findById(user);

//       if (!validUser) {
//         return res.status(400).json({ message: "Invalid user ID" });
//       }

//       const hasSavedAddress =
//         validUser.address &&
//         validUser.state &&
//         validUser.country &&
//         validUser.email &&
//         validUser.phone;

//       // Use saved address ONLY if frontend did NOT send one
//       if (!shippingAddress && hasSavedAddress) {
//         finalShippingAddress = {
//           fullName: validUser.name,
//           email: validUser.email,
//           phone: validUser.phone,
//           address: validUser.address,
//           state: validUser.state,
//           country: validUser.country,
//         };
//       }
//     }

//     if (!finalShippingAddress) {
//       return res.status(400).json({
//         message: "Shipping address is required",
//       });
//     }

//     /* ---------------- PRODUCT VALIDATION ---------------- */

//     for (const item of products) {
//       const productData = await ProductModel.findById(item.product);

//       if (!productData) {
//         return res.status(400).json({
//           message: `Product not found: ${item.product}`,
//         });
//       }

//       if (productData.stock < item.quantity) {
//         return res.status(400).json({
//           message: `Insufficient stock for ${productData.name}`,
//         });
//       }
//     }

//     /* ---------------- BUILD ORDER ITEMS ---------------- */

//     const productsWithPrice = await Promise.all(
//       products.map(async (item) => {
//         const productData = await ProductModel.findById(item.product).select(
//           "price",
//         );

//         if (item.quantity < 1) {
//           throw new Error("Invalid quantity");
//         }

//         return {
//           product: item.product,
//           quantity: item.quantity,
//           priceAtPurchase: productData.price,
//           variation: item.variation || null,
//         };
//       }),
//     );

//     /* ---------------- TOTAL ---------------- */

//     const subTotal = productsWithPrice.reduce(
//       (sum, item) => sum + item.quantity * item.priceAtPurchase,
//       0,
//     );

//     const totalAmount = subTotal + (shippingFee || 0);

//     /* ---------------- CREATE ORDER ---------------- */

//     const newOrder = new OrderModel({
//       orderId: generateOrderId(),
//       user: validUser ? validUser._id : null,
//       products: productsWithPrice,
//       status: status || "pending",
//       shippingAddress: finalShippingAddress,
//       payment,
//       subTotal,
//       shippingFee: shippingFee || 0,
//       totalAmount,
//     });

//     const savedOrder = await newOrder.save(); 


//     res.status(201).json({
//       message: "Order created successfully",
//       orderId: savedOrder.orderId,
//     });
//   } catch (error) {
//     console.error("Create Order Error:", error);
//     res.status(500).json({
//       message: "Error creating order",
//       error: error.message,
//     });
//   }
// };



exports.createOrder = async (req, res) => {
  try {
    const { user, products, status, shippingAddress, payment, shippingFee } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: "No products provided" });
    }

    let validUser = null;
    let finalShippingAddress = shippingAddress;

    /* ---------------- USER VALIDATION ---------------- */
    if (user) {
      validUser = await userModel.findById(user);
      if (!validUser) return res.status(400).json({ message: "Invalid user ID" });

      const hasSavedAddress =
        validUser.address && validUser.state && validUser.country && validUser.email && validUser.phone;

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

    /* ---------------- PRODUCT VALIDATION ---------------- */
    for (const item of products) {
      const productData = await ProductModel.findById(item.product);
      if (!productData) return res.status(400).json({ message: `Product not found: ${item.product}` });
      if (productData.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${productData.name}` });
    }

    /* ---------------- BUILD ORDER ITEMS ---------------- */
    const productsWithPrice = await Promise.all(
      products.map(async (item) => {
        const productData = await ProductModel.findById(item.product).select("price");
        if (item.quantity < 1) throw new Error("Invalid quantity");
        return {
          product: item.product,
          quantity: item.quantity,
          priceAtPurchase: productData.price,
          variation: item.variation || null,
        };
      }),
    );

    /* ---------------- TOTAL ---------------- */
    const subTotal = productsWithPrice.reduce((sum, item) => sum + item.quantity * item.priceAtPurchase, 0);
    const totalAmount = subTotal + (shippingFee || 0);

    /* ---------------- CREATE ORDER ---------------- */
    const newOrder = new OrderModel({
      orderId: generateOrderId(),
      user: validUser ? validUser._id : null,
      products: productsWithPrice,
      status: status || "pending",
      shippingAddress: finalShippingAddress,
      payment,
      subTotal,
      shippingFee: shippingFee || 0,
      totalAmount,
    });

    const savedOrder = await newOrder.save();

    // Send response first
    res.status(201).json({
      message: "Order created successfully",
      orderId: savedOrder.orderId,
    });

    // ---------------- SEND ORDER CONFIRMATION EMAIL ----------------
    if (finalShippingAddress.email) {
      const orderConfirmationHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 40px auto; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e0e0e0;">
        <div style="background-color: #2a9d8f; color: #fff; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
        </div>
        <div style="padding: 30px 20px; background-color: #fff;">
          <p style="font-size: 16px; margin: 0 0 15px;">Hi ${finalShippingAddress.fullName},</p>
          <p style="font-size: 16px; margin: 0 0 25px;">Thank you for your order. Your order <strong>#${savedOrder.orderId}</strong> has been successfully placed and is on the way!</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px; font-size: 16px;">Order Summary:</h3>
            <ul style="padding-left: 20px; margin: 0;">
              ${productsWithPrice.map(p => `<li>${p.quantity} × ${p.product.name} - ₦${p.priceAtPurchase}</li>`).join('')}
            </ul>
            <p style="margin-top: 10px; font-weight: bold;">Total: ₦${totalAmount}</p>
          </div>
          <p style="font-size: 16px; margin: 0 0 25px;">You can track your order and manage your account by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="https://ajahmart.com/orders/${savedOrder.orderId}" style="display: inline-block; padding: 12px 25px; background-color: #e76f51; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">View Your Order</a>
          </div>
          <p style="margin-top: 30px; font-size: 13px; color: #666;">If you did not place this order, please contact our support immediately.</p>
        </div>
        <div style="background-color: #f4f4f4; text-align: center; padding: 15px 20px; font-size: 12px; color: #999;">
          © 2026 Your Store. All rights reserved.
        </div>
      </div>
      `;

      // fire-and-forget
      sendEmail({
        to: finalShippingAddress.email,
        subject: `Your Order #${savedOrder.orderId} is Confirmed!`,
        text: `Hi ${finalShippingAddress.fullName}, your order #${savedOrder.orderId} has been placed. Total: $${totalAmount}.`,
        html: orderConfirmationHtml,
      }).catch(err => console.error("Error sending order confirmation email:", err));
    }

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
      "products.product", // use the actual field in your schema
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
      "products.product", // use the actual field in your schema
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
      subTotal : order.subTotal, 
      shippingFee : order.shippingFee, 
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

// Controller function to update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Controller function to delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};

// Controller function to get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await OrderModel.find({ user: userId }) // correct field
      .populate("user", "name email") // optional
      .populate("products.product", "name price images"); // correct path

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user orders",
      error: error.message,
    });
  }
};

// Controller function to get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find().populate(
      "products.product",
      "name price",
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching all orders",
      error: error.message,
    });
  }
};

////controller function to get latest 20 orders
exports.getLatestOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("products.product", "name price"); 
      
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest orders",
      error: error.message,
    });
  }
};
