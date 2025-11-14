const nodemailer = require('nodemailer');
const User = require('../models/User');

// Create transporter
const createTransporter = () => {
  // Check if SMTP credentials are configured
  const hasSMTPCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  // If in development mode and no SMTP credentials, use console logging
  if (process.env.NODE_ENV === 'development' && !hasSMTPCredentials) {
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 DEVELOPMENT MODE - Email would be sent:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('OTP:', mailOptions.html.match(/([0-9]{6})/)?.[1] || 'N/A');
        console.log('--- Email content ---');
        console.log('From:', mailOptions.from);
        console.log('Body preview:', mailOptions.html.substring(0, 200) + '...');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }

  // Use actual SMTP transport if credentials are available
  const transporter = nodemailer.createTransport({
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

// Build a consistent From header with display name 'securefinance'
const getFromHeader = () => {
  // Default email address to use if none provided
  let email = 'noreply@securefinance.com';

  if (process.env.SMTP_FROM) {
    const raw = process.env.SMTP_FROM.trim();
    // If SMTP_FROM contains an address in angle brackets, extract it
    const match = raw.match(/<([^>]+)>/);
    if (match && match[1]) {
      email = match[1].trim();
    } else if (raw.includes('@')) {
      // If it's just an email address
      email = raw;
    } else {
      // If it's a name only (unlikely), fallback to default email
      email = 'noreply@securefinance.com';
    }
  }

  // Use display name as requested by user: SecureFinance
  return `SecureFinance <${email}>`;
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
      from: getFromHeader(),
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
      from: getFromHeader(),
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
const sendOTPEmail = async (email, otp, type = 'login') => {
  try {
    console.log(`Sending ${type} OTP email to:`, email);

    const transporter = createTransporter();

    const subject = type === 'password reset'
      ? 'Your Password Reset Code for ChatBased Finance'
      : 'Your OTP for ChatBased Finance Login';

    const title = type === 'password reset'
      ? 'Password Reset Verification'
      : 'Secure Login Verification';

    const description = type === 'password reset'
      ? 'To reset your password for ChatBased Finance, please use the following verification code:'
      : 'To complete your login to ChatBased Finance, please use the following verification code:';

    const mailOptions = {
      from: getFromHeader(),
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0ea5a4 0%, #065f46 100%); padding: 28px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Secure Finance</h1>
            <p style="color: #e6f7f2; margin: 8px 0 0 0; font-size: 14px;">${title}</p>
          </div>

          <div style="background-color: #ffffff; padding: 28px 24px; border: 1px solid #e6e6e6; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #111827; margin-top: 0;">Your One-Time Password</h2>

            <p style="color: #374151; line-height: 1.6;">
              ${description}
            </p>

            <div style="background-color: #f3f4f6; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 22px 0; text-align: center;">
              <span style="font-size: 30px; font-weight: 700; color: #065f46; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </span>
            </div>

            <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 12px; border-radius: 4px; margin: 18px 0;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                <strong>Important:</strong> This OTP will expire in 10 minutes for security reasons.
              </p>
            </div>

            <p style="color: #374151; font-size: 14px; line-height: 1.6;">
              If you didn't request this ${type === 'password reset' ? 'password reset' : 'login'}, please ignore this email. Your account remains secure.
            </p>

            <p style="color: #374151; font-size: 14px;">
              For security reasons, never share this code with anyone.
            </p>
          </div>

          <div style="text-align: center; padding: 14px; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from Secure Finance. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Secure Finance. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`${type} OTP email sent successfully:`, info.messageId);

    return true;
  } catch (error) {
    console.error(`Error sending ${type} OTP email:`, error);
    return false;
  }
};

  // Send password reset confirmation
  const sendPasswordResetConfirmationEmail = async (email, name) => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: getFromHeader(),
        to: email,
        subject: 'Your Secure Finance Password Has Been Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5a4 0%, #065f46 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Secure Finance</h1>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #e6e6e6; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #111827;">Password Reset Successful</h2>
              <p style="color: #374151;">Hi ${name || 'there'},</p>
              <p style="color: #374151;">This is a confirmation that your Secure Finance account password was successfully reset. If you initiated this change, no further action is required.</p>
              <p style="color: #374151;">If you did not request this change, please contact our support immediately or reset your password again.</p>
              <p style="color: #374151;">Thanks,<br/>Secure Finance Team</p>
            </div>
            <div style="text-align: center; padding: 12px; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Secure Finance</div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset confirmation email:', error);
      return false;
    }
  };

  // Send login success notification
  const sendLoginSuccessEmail = async (email, name, meta = {}) => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: getFromHeader(),
        to: email,
        subject: 'Successful Login to Secure Finance',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5a4 0%, #065f46 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Secure Finance</h1>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #e6e6e6; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #111827;">Login Successful</h2>
              <p style="color: #374151;">Hi ${name || 'there'},</p>
              <p style="color: #374151;">We detected a successful login to your Secure Finance account.</p>
              ${meta.ip ? `<p style="color:#374151;">IP: ${meta.ip}</p>` : ''}
              ${meta.device ? `<p style="color:#374151;">Device: ${meta.device}</p>` : ''}
              <p style="color: #374151;">If this was you, you can safely ignore this message. If you suspect any unauthorized access, please reset your password immediately.</p>
              <p style="color: #374151;">Thanks,<br/>Secure Finance Team</p>
            </div>
            <div style="text-align: center; padding: 12px; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Secure Finance</div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending login success email:', error);
      return false;
    }
  };

  // Send login failure notification (only if account exists)
  const sendLoginFailureEmail = async (email, name, reason = '') => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: getFromHeader(),
        to: email,
        subject: 'Failed Login Attempt on Secure Finance',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5a4 0%, #065f46 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Secure Finance</h1>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #e6e6e6; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #111827;">Failed Login Attempt</h2>
              <p style="color: #374151;">Hi ${name || 'there'},</p>
              <p style="color: #374151;">We detected a failed login attempt to your Secure Finance account.</p>
              ${reason ? `<p style="color:#374151;">Reason: ${reason}</p>` : ''}
              <p style="color: #374151;">If this wasn't you, please consider resetting your password and enabling additional security on your account.</p>
              <p style="color: #374151;">Thanks,<br/>Secure Finance Team</p>
            </div>
            <div style="text-align: center; padding: 12px; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Secure Finance</div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending login failure email:', error);
      return false;
    }
  };

module.exports = {
  sendSplitBillEscalationEmail,
  sendPaymentConfirmationEmail,
  sendOTPEmail,
  sendPasswordResetConfirmationEmail,
  sendLoginSuccessEmail,
  sendLoginFailureEmail
};