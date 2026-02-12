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
                productName: productData.name,
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

        const orderConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #ddd;">
        <h2>Order Confirmation - #${order.orderId}</h2>
        <p>Hi ${order.shippingAddress.fullName}, thank you for your order!</p>
        <p>Total: ₦${formatPrice(order.totalAmount)}</p>
        <p>Status: ${order.payment.paid ? "Paid" : "Pending"}</p>
        <hr/>
        <p>We are processing your order and will notify you soon.</p>
      </div>
    `;

        sendEmail({
            to: order.shippingAddress.email,
            subject: `Your Order #${order.orderId} is Confirmed!`,
            text: `Your order #${order.orderId} has been placed. Total: ₦${formatPrice(order.totalAmount)}`,
            html: orderConfirmationHtml,
        }).catch((err) => console.error("Email Error:", err));
    }
}

module.exports = {
    finalizeOrder,
    generateOrderId,
};
