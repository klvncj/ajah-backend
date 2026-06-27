const OrderModel = require("../models/order.model");
const ProductModel = require("../models/product.model");
const TransactionModel = require("../models/transaction");
const { withTransaction } = require("./dbTransaction");
const { sendEmail } = require("./mailer");
const crypto = require("crypto");

// Utility to generate a random, readable order number
function generateOrderId() {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    const timestamp = Date.now().toString().slice(-5);
    return `ORD-${timestamp}-${random}`;
}

/**
 * Finalizes an order by checking stock, decrementing stock, 
 * creating the order record, and marking the transaction as successful.
 * This is shared between the user redirect (createOrder) and the Webhook.
 */
async function finalizeOrder({ orderData, paymentData, tx_ref }) {
    return await withTransaction(async (session) => {
        // 1. Check if already processed (Idempotency)
        if (tx_ref) {
            const existingTx = await TransactionModel.findOne({ tx_ref }).session(session);
            if (existingTx && existingTx.status === "successful") {
                return { alreadyProcessed: true, orderId: "ALREADY_PROCESSED" };
            }
        }

        const { user, products, shippingAddress, shippingFee } = orderData;

        // 2. Validate and Update Stock
        const productsWithPrice = [];
        for (const item of products) {
            const productData = await ProductModel.findById(item.product).session(session);
            if (!productData) throw new Error(`Product not found: ${item.product}`);
            if (productData.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${productData.name}`);
            }

            productsWithPrice.push({
                product: productData._id,
                name: productData.name,
                quantity: item.quantity,
                priceAtPurchase: productData.price,
                variation: item.variation || null,
            });

            productData.stock -= item.quantity;
            await productData.save({ session });
        }

        const subTotal = productsWithPrice.reduce(
            (sum, item) => sum + item.quantity * item.priceAtPurchase,
            0,
        );
        const totalAmount = subTotal + (shippingFee || 0);

        // 3. Create Order
        const newOrder = new OrderModel({
            orderId: generateOrderId(),
            user: user || null,
            products: productsWithPrice,
            status: "pending",
            shippingAddress,
            payment: {
                ...paymentData,
                paid: paymentData?.paid || false,
            },
            subTotal,
            shippingFee: shippingFee || 0,
            totalAmount,
        });

        const savedOrder = await newOrder.save({ session });

        // 4. Update Transaction status
        if (tx_ref) {
            await TransactionModel.findOneAndUpdate(
                { tx_ref },
                { status: "successful", flw_ref: paymentData?.transactionId },
                { session }
            );
        }

        // 5. Trigger Email (Async)
        triggerOrderEmail(savedOrder);

        return savedOrder;
    });
}

function triggerOrderEmail(order) {
    if (typeof sendEmail === "function" && order.shippingAddress?.email) {
        const formatPrice = (n) =>
            Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });

        const orderDate = order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) 
            : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
            
        const productRows = order.products.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">
              <p style="margin: 0; font-weight: 600; color: #111827;">${item.name || "Product"}</p>
              ${item.variation && item.variation !== 'None' ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Variation: ${item.variation}</p>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #4b5563;">
              ${item.quantity}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #111827;">
              ₦${formatPrice(item.priceAtPurchase * item.quantity)}
            </td>
          </tr>
        `).join("");

        const orderConfirmationHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #374151;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="background-color: #111827; padding: 32px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Thank You for Your Order!</h1>
              <p style="color: #9ca3af; margin: 8px 0 0; font-size: 16px;">We've received your order and are getting it ready.</p>
            </div>

            <div style="padding: 32px;">
              <p style="font-size: 16px; margin-top: 0;">Hi <strong>${order.shippingAddress.fullName}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.5; color: #4b5563;">Thank you for shopping with us! Your order <strong>#${order.orderId}</strong> has been successfully placed. Here are your order details:</p>

              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 24px 0; display: table; width: 100%; box-sizing: border-box;">
                <div style="display: table-cell; width: 50%;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Order Date</p>
                  <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111827;">${orderDate}</p>
                </div>
                <div style="display: table-cell; width: 50%;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Payment Method</p>
                  <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111827; text-transform: capitalize;">${(order.payment?.method || "").replace(/_/g, " ")}</p>
                </div>
              </div>

              <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 32px 0 16px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Order Items</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 13px; color: #6b7280; text-transform: uppercase;">Item</th>
                    <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 13px; color: #6b7280; text-transform: uppercase;">Qty</th>
                    <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 13px; color: #6b7280; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>

              <div style="width: 100%; max-width: 300px; margin-left: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Subtotal</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">₦${formatPrice(order.subTotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Shipping Fee</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">₦${formatPrice(order.shippingFee)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-top: 2px solid #e5e7eb; font-weight: 700; font-size: 16px; color: #111827;">Total</td>
                    <td style="padding: 12px 0; border-top: 2px solid #e5e7eb; text-align: right; font-weight: 700; font-size: 16px; color: #111827;">₦${formatPrice(order.totalAmount)}</td>
                  </tr>
                </table>
              </div>

              <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 32px 0 16px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Shipping Details</h2>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px;">
                <p style="margin: 0; font-weight: 600; color: #111827;">${order.shippingAddress.fullName}</p>
                <p style="margin: 4px 0 0; color: #4b5563;">${order.shippingAddress.address}</p>
                <p style="margin: 4px 0 0; color: #4b5563;">${order.shippingAddress.state}, ${order.shippingAddress.country}</p>
                <p style="margin: 12px 0 0; color: #4b5563;"><strong>Email:</strong> ${order.shippingAddress.email}</p>
                <p style="margin: 4px 0 0; color: #4b5563;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
              </div>

              <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                If you have any questions, simply reply to this email or contact our support team.
              </p>
            </div>
          </div>
        </div>
        `;

        const adminProductRows = order.products.map(item => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
              <p style="margin: 0; font-weight: bold; color: #333;">${item.name || "Product"}</p>
              ${item.variation && item.variation !== 'None' ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">Variation: ${item.variation}</p>` : ''}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; color: #333;">
              x ${item.quantity}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #333;">
              ₦${formatPrice(item.priceAtPurchase * item.quantity)}
            </td>
          </tr>
        `).join("");

        const adminOrderHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #dfe3e8; overflow: hidden;">
            <div style="padding: 20px 30px; border-bottom: 1px solid #dfe3e8; background-color: #f9fafb;">
              <h2 style="margin: 0; font-size: 20px; color: #212b36;">New Order ${order.orderId}</h2>
              <p style="margin: 5px 0 0; color: #637381; font-size: 14px;">Placed on ${orderDate} by ${order.shippingAddress.fullName}</p>
            </div>
            
            <div style="padding: 30px;">
              <h3 style="margin-top: 0; font-size: 16px; color: #212b36; text-transform: uppercase; font-weight: 600;">Items to Pack</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                ${adminProductRows}
              </table>

              <div style="display: table; width: 100%; margin-bottom: 30px;">
                <div style="display: table-cell; width: 50%; padding-right: 20px; vertical-align: top;">
                  <h3 style="margin-top: 0; font-size: 14px; color: #212b36; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 8px;">Shipping Address</h3>
                  <p style="margin: 8px 0 4px; font-weight: bold;">${order.shippingAddress.fullName}</p>
                  <p style="margin: 0 0 4px; color: #454f5b;">${order.shippingAddress.address}</p>
                  <p style="margin: 0 0 4px; color: #454f5b;">${order.shippingAddress.city ? order.shippingAddress.city + ', ' : ''}${order.shippingAddress.state}, ${order.shippingAddress.country}</p>
                </div>
                <div style="display: table-cell; width: 50%; vertical-align: top;">
                  <h3 style="margin-top: 0; font-size: 14px; color: #212b36; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 8px;">Customer Details</h3>
                  <p style="margin: 8px 0 4px; color: #454f5b;"><strong>Email:</strong> <a href="mailto:${order.shippingAddress.email}" style="color: #006fbb; text-decoration: none;">${order.shippingAddress.email}</a></p>
                  <p style="margin: 0 0 4px; color: #454f5b;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
                  <p style="margin: 0 0 4px; color: #454f5b;"><strong>Payment:</strong> ${(order.payment?.method || "").replace(/_/g, " ")}</p>
                </div>
              </div>

              <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; border: 1px solid #eee;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #637381; font-size: 14px;">Subtotal</td>
                    <td style="padding: 4px 0; text-align: right; color: #212b36; font-size: 14px;">₦${formatPrice(order.subTotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #637381; font-size: 14px;">Shipping</td>
                    <td style="padding: 4px 0; text-align: right; color: #212b36; font-size: 14px;">₦${formatPrice(order.shippingFee)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0; color: #212b36; font-weight: bold; font-size: 16px; border-top: 1px solid #dfe3e8;">Total</td>
                    <td style="padding: 12px 0 0; text-align: right; color: #212b36; font-weight: bold; font-size: 16px; border-top: 1px solid #dfe3e8;">₦${formatPrice(order.totalAmount)}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>
        `;

        // 1. Send Customer Confirmation Email
        sendEmail({
            to: order.shippingAddress.email,
            subject: `Your Order #${order.orderId} is Confirmed!`,
            text: `Your order #${order.orderId} has been placed. Total: ₦${formatPrice(order.totalAmount)}`,
            html: orderConfirmationHtml,
        }).catch((err) => console.error("Customer Email Error:", err));

        // 2. Send Admin Notification Email
        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `[New Order] #${order.orderId} from ${order.shippingAddress.fullName}`,
            text: `New order #${order.orderId} placed by ${order.shippingAddress.fullName}. Total: ₦${formatPrice(order.totalAmount)}`,
            html: adminOrderHtml,
        }).catch((err) => console.error("Admin Email Error:", err));
    }
}

module.exports = {
    finalizeOrder,
    generateOrderId,
};
