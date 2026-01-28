const OrderModel = require("../models/order.model");
const ProductModel = require("../models/product.model");
const crypto = require("crypto"); // for generating secure orderId
const userModel = require("../models/user.model");
const { sendEmail, getStatusEmailHtml } = require("../utility/mailer");

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
//       if (!validUser)
//         return res.status(400).json({ message: "Invalid user ID" });

//       const hasSavedAddress =
//         validUser.address &&
//         validUser.state &&
//         validUser.country &&
//         validUser.email &&
//         validUser.phone;

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
//       return res.status(400).json({ message: "Shipping address is required" });
//     }

//     /* ---------------- PRODUCT VALIDATION ---------------- */
//     for (const item of products) {
//       const productData = await ProductModel.findById(item.product);
//       if (!productData)
//         return res
//           .status(400)
//           .json({ message: `Product not found: ${item.product}` });
//       if (productData.stock < item.quantity)
//         return res
//           .status(400)
//           .json({ message: `Insufficient stock for ${productData.name}` });
//     }

//     /* ---------------- BUILD ORDER ITEMS ---------------- */
//     const productsWithPrice = await Promise.all(
//       products.map(async (item) => {
//         const productData = await ProductModel.findById(item.product).select(
//           "name price",
//         );

//         if (!productData) throw new Error("Product not found");
//         if (item.quantity < 1) throw new Error("Invalid quantity");

//         return {
//           product: productData._id,
//           productName: productData.name,
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

//     // Send response first
//     res.status(201).json({
//       message: "Order created successfully",
//       orderId: savedOrder.orderId,
//     });

//     // ---------------- SEND ORDER CONFIRMATION EMAIL ----------------
//     if (typeof sendEmail === "function" && finalShippingAddress.email) {
//       const formatPrice = (n) =>
//         Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });

//       const orderConfirmationHtml = `
// <div style="font-family: Arial, Helvetica, sans-serif; background:#f5f5f5; padding:40px 0;">
//   <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb;">

//     <!-- HEADER -->
//     <div style="background:#2a9d8f; padding:24px; text-align:center; color:#ffffff;">
//       <h1 style="margin:0; font-size:26px;">Order Confirmed</h1>
//       <p style="margin:6px 0 0; font-size:14px;">
//         Order #${savedOrder.orderId}
//       </p>
//     </div>

//     <!-- BODY -->
//     <div style="padding:24px;">
//       <p style="font-size:15px; margin:0 0 16px;">
//         Hi ${finalShippingAddress.fullName},
//       </p>

//       <p style="font-size:15px; margin:0 0 24px;">
//         Thank you for your order. Below is a full breakdown of your purchase.
//       </p>

//       <!-- ORDER ITEMS -->
//       <h3 style="margin:0 0 12px; font-size:16px;">Order Items</h3>
//       <div style="border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
//         <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-size:14px;">
//           <thead style="background:#f9fafb;">
//             <tr>
//               <th align="left" style="padding:12px; border-bottom:1px solid #e5e7eb;">Product</th>
//               <th align="center" style="padding:12px; border-bottom:1px solid #e5e7eb;">Qty</th>
//               <th align="right" style="padding:12px; border-bottom:1px solid #e5e7eb;">Unit</th>
//               <th align="right" style="padding:12px; border-bottom:1px solid #e5e7eb;">Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${productsWithPrice
//               .map(
//                 (item) => `
//               <tr>
//                 <td style="padding:12px; border-bottom:1px solid #f0f0f0;">
//                   <strong>${item.productName}</strong>
//                 </td>
//                 <td align="center" style="padding:12px; border-bottom:1px solid #f0f0f0;">
//                   ${item.quantity}
//                 </td>
//                 <td align="right" style="padding:12px; border-bottom:1px solid #f0f0f0;">
//                   ₦${formatPrice(item.priceAtPurchase)}
//                 </td>
//                 <td align="right" style="padding:12px; border-bottom:1px solid #f0f0f0;">
//                   ₦${formatPrice(item.priceAtPurchase * item.quantity)}
//                 </td>
//               </tr>
//             `,
//               )
//               .join("")}
//           </tbody>
//           <tfoot style="background:#f9fafb;">
//             <tr>
//               <td colspan="3" align="right" style="padding:10px; font-weight:600;">
//                 Subtotal
//               </td>
//               <td align="right" style="padding:10px; font-weight:600;">
//                 ₦${formatPrice(subTotal)}
//               </td>
//             </tr>
//             <tr>
//               <td colspan="3" align="right" style="padding:10px; font-weight:600;">
//                 Shipping Fee
//               </td>
//               <td align="right" style="padding:10px; font-weight:600;">
//                 ₦${formatPrice(shippingFee || 0)}
//               </td>
//             </tr>
//             <tr>
//               <td colspan="3" align="right" style="padding:14px; font-size:16px; font-weight:700;">
//                 Total
//               </td>
//               <td align="right" style="padding:14px; font-size:16px; font-weight:700;">
//                 ₦${formatPrice(totalAmount)}
//               </td>
//             </tr>
//           </tfoot>
//         </table>
//       </div>

//       <!-- PAYMENT INFO -->
//       <h3 style="margin:28px 0 12px; font-size:16px;">Payment Information</h3>
//       <div style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; font-size:14px;">
//         <p style="margin:0 0 8px;">
//           <strong>Method:</strong> ${
//             payment?.method?.replace(/_/g, " ") || "Not specified"
//           }
//         </p>
//         <p style="margin:0 0 8px;">
//           <strong>Status:</strong> ${payment?.paid ? "Paid" : "Unpaid"}
//         </p>
//         ${
//           payment?.transactionId
//             ? `<p style="margin:0;"><strong>Transaction ID:</strong> ${payment.transactionId}</p>`
//             : ""
//         }
//       </div>

//       <!-- SHIPPING INFO -->
//       <h3 style="margin:28px 0 12px; font-size:16px;">Shipping Address</h3>
//       <div style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; font-size:14px;">
//         <p style="margin:0; font-weight:600;">${finalShippingAddress.fullName}</p>
//         <p style="margin:4px 0 0;">${finalShippingAddress.address}</p>
//         <p style="margin:4px 0 0;">
//           ${finalShippingAddress.state}, ${finalShippingAddress.country}
//         </p>
//         <p style="margin:4px 0 0;">${finalShippingAddress.phone}</p>
//       </div>

//       <!-- CTA -->
//       <div style="text-align:center; margin:32px 0 0;">
//         <a
//           href="https://ajahmart.com/orders/${savedOrder.orderId}"
//           style="display:inline-block; padding:12px 28px; background:#e76f51; color:#ffffff; text-decoration:none; font-weight:600; border-radius:6px;"
//         >
//           View Order
//         </a>
//       </div>
//     </div>

//     <!-- FOOTER -->
//     <div style="background:#f3f4f6; padding:14px; text-align:center; font-size:12px; color:#6b7280;">
//       © 2026 AjahMart. All rights reserved.
//     </div>
//   </div>
// </div>
// `;

//       sendEmail({
//         to: finalShippingAddress.email,
//         subject: `Your Order #${savedOrder.orderId} is Confirmed!`,
//         text: `Hi ${finalShippingAddress.fullName}, your order #${savedOrder.orderId} has been placed. Total: ₦${formatPrice(totalAmount)}.`,
//         html: orderConfirmationHtml,
//       }).catch((err) =>
//         console.error("Error sending order confirmation email:", err),
//       );
//     }
//   } catch (error) {
//     console.error("Create Order Error:", error);
//     res.status(500).json({
//       message: "Error creating order",
//       error: error.message,
//     });
//   }
// };

//


// Order creation controller
exports.createOrder = async (req, res) => {
  try {
    const { user, products, shippingAddress, payment, shippingFee } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: "No products provided" });
    }

    let validUser = null;
    let finalShippingAddress = shippingAddress;

    /* ---------------- USER VALIDATION ---------------- */
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

    /* ---------------- PRODUCT VALIDATION ---------------- */
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

    /* ---------------- BUILD ORDER ITEMS ---------------- */
    const productsWithPrice = await Promise.all(
      products.map(async (item) => {
        const productData = await ProductModel.findById(item.product).select(
          "name price",
        );

        if (!productData) throw new Error("Product not found");
        if (item.quantity < 1) throw new Error("Invalid quantity");

        return {
          product: productData._id,
          productName: productData.name,
          quantity: item.quantity,
          priceAtPurchase: productData.price,
          variation: item.variation || null,
        };
      }),
    );

    /* ---------------- TOTAL ---------------- */
    const subTotal = productsWithPrice.reduce(
      (sum, item) => sum + item.quantity * item.priceAtPurchase,
      0,
    );

    const totalAmount = subTotal + (shippingFee || 0);

    /* ---------------- CREATE ORDER ---------------- */
    const newOrder = new OrderModel({
      orderId: generateOrderId(),
      user: validUser ? validUser._id : null,
      products: productsWithPrice,
      status: "pending", // force initial state
      shippingAddress: finalShippingAddress,
      payment,
      subTotal,
      shippingFee: shippingFee || 0,
      totalAmount,
    });

    const savedOrder = await newOrder.save();

    /* ---------------- DECREMENT STOCK ---------------- */
    await Promise.all(
      productsWithPrice.map((item) =>
        ProductModel.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );

    /* ---------------- RESPONSE ---------------- */
    res.status(201).json({
      message: "Order created successfully",
      orderId: savedOrder.orderId,
    });

    /* ---------------- SEND EMAIL (FIRE AND FORGET) ---------------- */
    if (typeof sendEmail === "function" && finalShippingAddress.email) {
      const formatPrice = (n) =>
        Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });

      const orderConfirmationHtml = `
<div style="font-family: Arial, Helvetica, sans-serif; background:#f5f5f5; padding:40px 0;">
  <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb;">
    
    <!-- HEADER -->
    <div style="background:#2a9d8f; padding:24px; text-align:center; color:#ffffff;">
      <h1 style="margin:0; font-size:26px;">Order Confirmed</h1>
      <p style="margin:6px 0 0; font-size:14px;">
        Order #${savedOrder.orderId}
      </p>
    </div>

    <!-- BODY -->
    <div style="padding:24px;">
      <p style="font-size:15px; margin:0 0 16px;">
        Hi ${finalShippingAddress.fullName},
      </p>

      <p style="font-size:15px; margin:0 0 24px;">
        Thank you for your order. Below is a full breakdown of your purchase.
      </p>

      <!-- ORDER ITEMS -->
      <h3 style="margin:0 0 12px; font-size:16px;">Order Items</h3>
      <div style="border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-size:14px;">
          <thead style="background:#f9fafb;">
            <tr>
              <th align="left" style="padding:12px; border-bottom:1px solid #e5e7eb;">Product</th>
              <th align="center" style="padding:12px; border-bottom:1px solid #e5e7eb;">Qty</th>
              <th align="right" style="padding:12px; border-bottom:1px solid #e5e7eb;">Unit</th>
              <th align="right" style="padding:12px; border-bottom:1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productsWithPrice
              .map(
                (item) => `
              <tr>
                <td style="padding:12px; border-bottom:1px solid #f0f0f0;">
                  <strong>${item.productName}</strong>
                </td>
                <td align="center" style="padding:12px; border-bottom:1px solid #f0f0f0;">
                  ${item.quantity}
                </td>
                <td align="right" style="padding:12px; border-bottom:1px solid #f0f0f0;">
                  ₦${formatPrice(item.priceAtPurchase)}
                </td>
                <td align="right" style="padding:12px; border-bottom:1px solid #f0f0f0;">
                  ₦${formatPrice(item.priceAtPurchase * item.quantity)}
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot style="background:#f9fafb;">
            <tr>
              <td colspan="3" align="right" style="padding:10px; font-weight:600;">
                Subtotal
              </td>
              <td align="right" style="padding:10px; font-weight:600;">
                ₦${formatPrice(subTotal)}
              </td>
            </tr>
            <tr>
              <td colspan="3" align="right" style="padding:10px; font-weight:600;">
                Shipping Fee
              </td>
              <td align="right" style="padding:10px; font-weight:600;">
                ₦${formatPrice(shippingFee || 0)}
              </td>
            </tr>
            <tr>
              <td colspan="3" align="right" style="padding:14px; font-size:16px; font-weight:700;">
                Total
              </td>
              <td align="right" style="padding:14px; font-size:16px; font-weight:700;">
                ₦${formatPrice(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- PAYMENT INFO -->
      <h3 style="margin:28px 0 12px; font-size:16px;">Payment Information</h3>
      <div style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; font-size:14px;">
        <p style="margin:0 0 8px;">
          <strong>Method:</strong> ${
            payment?.method?.replace(/_/g, " ") || "Not specified"
          }
        </p>
        <p style="margin:0 0 8px;">
          <strong>Status:</strong> ${payment?.paid ? "Paid" : "Unpaid"}
        </p>
        ${
          payment?.transactionId
            ? `<p style="margin:0;"><strong>Transaction ID:</strong> ${payment.transactionId}</p>`
            : ""
        }
      </div>

      <!-- SHIPPING INFO -->
      <h3 style="margin:28px 0 12px; font-size:16px;">Shipping Address</h3>
      <div style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; font-size:14px;">
        <p style="margin:0; font-weight:600;">${finalShippingAddress.fullName}</p>
        <p style="margin:4px 0 0;">${finalShippingAddress.address}</p>
        <p style="margin:4px 0 0;">
          ${finalShippingAddress.state}, ${finalShippingAddress.country}
        </p>
        <p style="margin:4px 0 0;">${finalShippingAddress.phone}</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center; margin:32px 0 0;">
        <a
          href="https://ajah-eight.vercel/checkout/completed/${savedOrder.orderId}"
          style="display:inline-block; padding:12px 28px; background:#e76f51; color:#ffffff; text-decoration:none; font-weight:600; border-radius:6px;"
        >
          View Order
        </a>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background:#f3f4f6; padding:14px; text-align:center; font-size:12px; color:#6b7280;">
      © 2026 AjahMart. All rights reserved.
    </div>
  </div>
</div>
`;

      sendEmail({
        to: finalShippingAddress.email,
        subject: `Your Order #${savedOrder.orderId} is Confirmed!`,
        text: `Hi ${finalShippingAddress.fullName}, your order #${savedOrder.orderId} has been placed. Total: ₦${formatPrice(
          totalAmount,
        )}.`,
        html: orderConfirmationHtml,
      }).catch((err) =>
        console.error("Error sending order confirmation email:", err),
      );
    }
  } catch (error) {
    console.error("Create Order Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Error creating order",
        error: error.message,
      });
    }
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

// Controller function to update order status
// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { status } = req.body;
//     const updatedOrder = await OrderModel.findByIdAndUpdate(
//       orderId,
//       { status },
//       { new: true },
//     );
//     if (!updatedOrder) {
//       return res.status(404).json({ message: "Order not found" });
//     }
//     res.status(200).json({
//       message: "Order status updated successfully",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error updating order status", error: error.message });
//   }
// };

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // 1. Fetch order first
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Exit early if no real change
    if (order.status === status) {
      return res.status(200).json({
        message: "Status unchanged",
        order,
      });
    }

    const previousStatus = order.status;

    // 3. Update
    order.status = status;
    order.updatedAt = new Date();
    const updatedOrder = await order.save();

    // 4. Respond immediately
    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });

    // 5. Fire email asynchronously
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
