const nodemailer = require("nodemailer");

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'outlook', 
  auth: {
    user: process.env.SMTP_USER,      // your email
    pass: process.env.SMTP_PASS     // Gmail requires App Password if 2FA is on
  }
});

// Function to send an email
async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to,
    subject,
    text,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = {
  sendEmail,
};
