const nodemailer = require("nodemailer");

// transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// sendEmail function
const sendEmail = async ({ to, bcc, subject, text, html }) => {
  const mailOptions = {
    from: `"AjahMart" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    bcc,
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
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #374151;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      
      <div style="background-color: #111827; padding: 32px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Order Status Updated</h1>
        <p style="color: #9ca3af; margin: 8px 0 0; font-size: 16px;">There is an update regarding your order.</p>
      </div>

      <div style="padding: 32px;">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${order.shippingAddress.fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.5; color: #4b5563;">${messages[order.status]}</p>

        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 24px 0; display: table; width: 100%; box-sizing: border-box;">
          <div style="display: table-cell; width: 100%;">
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Order ID</p>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111827;">#${order.orderId}</p>
          </div>
        </div>

        <div style="width: 100%; max-width: 400px; margin: 0 auto 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Previous Status</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #4b5563; text-transform: capitalize;">${previousStatus}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #111827; font-weight: 600; font-size: 15px;">New Status</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #111827; font-size: 15px; text-transform: capitalize;">${order.status}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.FRONTEND_URL || 'https://www.ajamart.store'}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 14px;">Visit Our Store</a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          If you have any questions, simply reply to this email or contact our support team.
        </p>
      </div>
    </div>
  </div>
  `;
};

module.exports = {
  sendEmail,
  getStatusEmailHtml,
};
