const nodemailer = require("nodemailer");

// transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// sendEmail function
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: '"My Store" <test@example.com>',
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const getStatusEmailHtml = (order, previousStatus) => {
  const messages = {
    pending: "Your order has been received and is pending.",
    processing: "Your order is now being processed.",
    shipped: "Your order has been shipped.",
    completed: "Your order has been completed.",
    cancelled: "Your order has been cancelled.",
  };

  return `
  <div style="font-family:Arial;background:#f5f5f5;padding:40px">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
      <div style="background:#111827;color:#fff;padding:20px;text-align:center">
        <h2>Order Status Updated</h2>
      </div>
      <div style="padding:24px;font-size:14px">
        <p>Hi ${order.shippingAddress.fullName},</p>
        <p>${messages[order.status]}</p>
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Previous:</strong> ${previousStatus}</p>
        <p><strong>Current:</strong> ${order.status}</p>
      </div>
    </div>
  </div>
  `;
};




module.exports = {sendEmail, getStatusEmailHtml};  // <-- export the function directly
