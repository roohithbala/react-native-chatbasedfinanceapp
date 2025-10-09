const nodemailer = require('nodemailer');
const User = require('../models/User');

// Create transporter
const createTransporter = () => {
  // For development, we'll use a test service
  // In production, you'd use your actual SMTP settings
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

// Send split bill escalation email
const sendSplitBillEscalationEmail = async (recipientUserId, splitBill, requesterUser) => {
  try {
    const recipient = await User.findById(recipientUserId);
    if (!recipient || !recipient.email) {
      console.log('Recipient not found or no email for user:', recipientUserId);
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@chatbasedfinance.com',
      to: recipient.email,
      subject: `Payment Reminder: ${splitBill.description}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment Reminder</h2>

          <p>Hi ${recipient.name || 'there'},</p>

          <p><strong>${requesterUser.name}</strong> is requesting payment for:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${splitBill.description}</h3>
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">
              Amount: ₹${splitBill.totalAmount.toFixed(2)}
            </p>
            <p style="color: #666;">
              Requested by: ${requesterUser.name}<br>
              Date: ${new Date(splitBill.createdAt).toLocaleDateString()}
            </p>
          </div>

          <p>Please settle this payment as soon as possible through the ChatBased Finance app.</p>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Reminder:</strong> Keeping track of shared expenses helps maintain good financial relationships.
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            This is an automated reminder from ChatBased Finance.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px;">
            If you believe this email was sent in error, please contact support.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Split bill escalation email sent:', info.messageId);

    return true;
  } catch (error) {
    console.error('Error sending split bill escalation email:', error);
    return false;
  }
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (payerUserId, payeeUserId, splitBill, amount) => {
  try {
    const [payer, payee] = await Promise.all([
      User.findById(payerUserId),
      User.findById(payeeUserId)
    ]);

    if (!payer?.email || !payee) {
      console.log('Payer not found or no email, or payee not found');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@chatbasedfinance.com',
      to: payer.email,
      subject: `Payment Confirmed: ${splitBill.description}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Payment Confirmed! ✅</h2>

          <p>Hi ${payer.name || 'there'},</p>

          <p>Your payment has been successfully processed:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${splitBill.description}</h3>
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">
              Paid: ₹${amount.toFixed(2)}
            </p>
            <p style="color: #666;">
              Paid to: ${payee.name}<br>
              Date: ${new Date().toLocaleDateString()}
            </p>
          </div>

          <p>Thank you for using ChatBased Finance to manage your shared expenses!</p>

          <p style="color: #666; font-size: 14px;">
            This is an automated confirmation from ChatBased Finance.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent:', info.messageId);

    return true;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return false;
  }
};

module.exports = {
  sendSplitBillEscalationEmail,
  sendPaymentConfirmationEmail
};