const axios = require("axios");

const FLUTTERWAVE_URL = "https://api.flutterwave.com/v3";
const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

/*
 * Generates a Flutterwave payment link.
 * Payment options (amount, currency, email, name, tx_ref, redirect_url).
*/
async function generatePaymentLink(options) {
    try {
        const { amount, currency, email, name, tx_ref, redirect_url, meta } = options;

        const payload = {
            tx_ref,
            amount,
            currency: currency || "NGN",
            redirect_url,
            customer: {
                email,
                name,
            },
            customizations: {
                title: "Ajah Payment",
                description: "Complete your payment securely",
                logo: "https://ajahmart.com/logo.png",
            },
        };

        // Add meta if provided
        if (meta) {
            payload.meta = meta;
        }

        const response = await axios.post(
            `${FLUTTERWAVE_URL}/payments`,
            payload,
            {
                headers: { Authorization: `Bearer ${SECRET_KEY}` },
            },
        );

        return { link: response.data.data.link };
    } catch (error) {
        console.error(
            "Flutterwave Link Generation Failed:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

/*
 * Verifies a Flutterwave transaction.
 * The transaction ID returned from Flutterwave.
*/
async function verifyPayment(transactionId) {
    try {
        const response = await axios.get(
            `${FLUTTERWAVE_URL}/transactions/${transactionId}/verify`,
            {
                headers: { Authorization: `Bearer ${SECRET_KEY}` },
            },
        );

        const { status, tx_ref, flw_ref } = response.data.data;

        if (status === "successful") {
            return response.data.data;
        }

        return null;
    } catch (error) {
        console.error("Flutterwave Verification Failed:", error.message);
        throw error;
    }
}

module.exports = {
    generatePaymentLink,
    verifyPayment,
};
