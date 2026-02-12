const { finalizeOrder } = require("../utility/order.service");

/**
 * Flutterwave Webhook Handler
 * Confirms payment and creates the order if it hasn't been created yet.
 */
exports.flutterwaveWebhook = async (req, res) => {
    try {
        // 1. Verify Secret Hash
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
        const signature = req.headers["verif-hash"];

        if (!signature || signature !== secretHash) {
            console.warn("Unauthorized Webhook Attempt");
            return res.status(401).json({ message: "Invalid signature" });
        }

        const payload = req.body;

        // 2. Check Event Type
        if (payload.event !== "charge.completed") {
            return res.status(200).json({ message: "Event ignored" });
        }

        const { status, tx_ref, id: transactionId } = payload.data;

        if (status !== "successful") {
            return res.status(200).json({ message: "Transaction not successful" });
        }

        // 3. Finalize Order
        // The shared service handles idempotency (checks if already processed)
        const result = await finalizeOrder({
            orderData: payload.data.meta?.orderData || {}, // Fallback or retrieve from DB
            paymentData: {
                method: "card",
                transactionId,
                paid: true,
            },
            tx_ref,
        });

        if (result.alreadyProcessed) {
            console.log(`Webhook: Order ${tx_ref} already processed.`);
        } else {
            console.log(`Webhook: Order ${tx_ref} finalized successfully.`);
        }

        res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
