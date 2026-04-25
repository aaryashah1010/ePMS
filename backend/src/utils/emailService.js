const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Sends an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 */
async function sendEmail(to, subject, text) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"e-PMS Notifications" <noreply@epms.com>',
      to,
      subject,
      text
    };
    
    // For ethereal test accounts, you might not have user/pass in dev initially
    if (!process.env.SMTP_USER) {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
      return;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

module.exports = { sendEmail };
