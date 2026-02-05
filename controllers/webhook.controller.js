const crypto = require("crypto");
const Transaction = require("../models/transaction.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model"); // In case we need to restore stock on failure (optional)

exports.handlePaystackWebhook = async (req, res) => {
  try {
    // 1. Validate Event
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Ensure we have the raw body.
    // If express.json() is used globally, req.body is already parsed.
    // Secure verification requires the exact raw string.
    // If you configured the `verify` option in express.json() in index.js, use that.
    // Otherwise, we rely on JSON.stringify(req.body) BUT IT IS RISKY if key order changes.
    // For now, I will assume we update index.js to provide req.rawBody or similar,
    // OR we follow the user's provided snippet which uses JSON.stringify(req.body).
    // The user provided snippet: const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    // We will use that to match their expectation, but wrap it in a try-catch.

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    // 2. Retrieve the request's body
    const event = req.body;
    const { event: eventType, data } = event;

    // 3. Handle specific events
    if (eventType === "charge.success") {
      const {
        reference,
        amount,
        channel,
        currency,
        ip_address,
        gateway_response,
        status,
      } = data;

      // Paystack reference is usually our orderId (if we set it that way)
      // Check if transaction already exists to avoid duplicates
      const existingTx = await Transaction.findOne({ ref: reference });
      if (existingTx) {
        return res.status(200).send("Transaction already processed");
      }

      // Log the transaction
      const newTx = new Transaction({
        ref: reference,
        orderId: reference, // Assuming we passed orderId as reference
        amount,
        currency,
        status,
        gateway_response,
        channel,
        ip_address,
        log: event,
      });
      await newTx.save();

      // Update Order Status
      const order = await Order.findOne({ orderId: reference });
      if (order) {
        // Verify amount paid matches order total (Paystack amount is in kobo usually, order check depends on your logic)
        // Note: Paystack amount = 10000 = 100.00 NGN.
        // Check if your Order model stores amount in NGN or Kobo. Usually NGN.
        // So expected amount = order.totalAmount * 100.

        const expectedAmountInKobo = Math.round(order.totalAmount * 100);

        if (amount >= expectedAmountInKobo) {
          order.payment.paid = true;
          order.payment.transactionId = reference;
          // Only update status if it's currently pending/processing
          if (order.status === "pending") {
            order.status = "processing";
          }
          await order.save();
        } else {
          // Partial payment or mismatch? Log it.
          console.warn(
            `Payment amount mismatch for order ${order.orderId}. Expected ${expectedAmountInKobo}, got ${amount}`,
          );
        }
      }
    }

    // Always return 200 OK to Paystack
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    // Return 200 even on error to stop Paystack from retrying indefinitely?
    // Or 500 to retry? Paystack retries on non-200.
    // If it's a code error, maybe valid to retry.
    res.sendStatus(500);
  }
};
