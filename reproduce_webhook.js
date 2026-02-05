const crypto = require("crypto");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("./index"); // Import your app
const Order = require("./models/order.model");
const Transaction = require("./models/transaction.model");

// Mock environment variables if needed, but we are running in same env
// process.env.PAYSTACK_SECRET_KEY = "sk_test_8076d8506f1623f376eb2c4d5035cf5c8c303aee";

const secret =
  process.env.PAYSTACK_SECRET_KEY ||
  "sk_test_8076d8506f1623f376eb2c4d5035cf5c8c303aee";

// Sample webhook payload
const payload = {
  event: "charge.success",
  data: {
    id: 302961,
    domain: "test",
    status: "success",
    reference: "ORD-TEST-12345", // Will match our test order
    amount: 500000, // 5000.00 NGN
    message: null,
    gateway_response: "Successful",
    paid_at: "2026-02-05T15:00:00.000Z",
    created_at: "2026-02-05T14:55:00.000Z",
    channel: "card",
    currency: "NGN",
    ip_address: "127.0.0.1",
    metadata: {},
  },
};

const signature = crypto
  .createHmac("sha512", secret)
  .update(JSON.stringify(payload))
  .digest("hex");

async function runTest() {
  try {
    // 0. Connect DB (app does it, but we might need to wait or do it manually if app doesn't export connection promise cleanly)
    // The app middleware does connectDB, so on the first request it should connect.
    // However, to manipulate the DB *before* the request, we need a connection.
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URL);
    }

    console.log("Connected to DB");

    // 1. Create a dummy order
    const testOrderId = "ORD-TEST-12345";

    // Clean up previous test
    await Order.deleteOne({ orderId: testOrderId });
    await Transaction.deleteOne({ ref: testOrderId });

    const order = new Order({
      orderId: testOrderId,
      status: "pending",
      user: new mongoose.Types.ObjectId(), // Fake user ID
      shippingAddress: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "08012345678",
        address: "123 Test St",
        state: "Lagos",
        country: "Nigeria",
      },
      payment: {
        method: "card",
        paid: false,
      },
      subTotal: 4000,
      shippingFee: 1000,
      totalAmount: 5000, // Matches 500000 kobo
    });

    // We need to bypass validation for products array if it's required.
    // Order model says products is array of objects with required fields.
    // Let's add a dummy product.
    // We need a dummy product ID.
    const product = new mongoose.Types.ObjectId();
    order.products.push({
      product: product,
      quantity: 1,
      priceAtPurchase: 4000,
      variation: "Test",
    });

    await order.save();
    console.log("Test order created:", order.orderId);

    // 2. Send webhook request
    const res = await request(app)
      .post("/api/webhooks/paystack")
      .set("x-paystack-signature", signature)
      .send(payload)
      .expect(200);

    console.log("Webhook response:", res.text);

    // 3. Verify Order updated
    const updatedOrder = await Order.findOne({ orderId: testOrderId });
    console.log("Updated Order Status:", updatedOrder.status);
    console.log("Updated Order Paid:", updatedOrder.payment.paid);
    console.log(
      "Updated Order TransactionId:",
      updatedOrder.payment.transactionId,
    );

    if (
      updatedOrder.payment.paid === true &&
      updatedOrder.status === "processing" &&
      updatedOrder.payment.transactionId === testOrderId
    ) {
      console.log("✅ Order update verified!");
    } else {
      console.error("❌ Order update FAILED!");
    }

    // 4. Verify Transaction logged
    const tx = await Transaction.findOne({ ref: testOrderId });
    if (tx) {
      console.log("✅ Transaction logged successfully!");
      console.log("TX ID:", tx._id);
    } else {
      console.error("❌ Transaction logging FAILED!");
    }

    // Cleanup
    await Order.deleteOne({ orderId: testOrderId });
    await Transaction.deleteOne({ ref: testOrderId });

    console.log("Test finished.");
    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err);
    process.exit(1);
  }
}

runTest();
