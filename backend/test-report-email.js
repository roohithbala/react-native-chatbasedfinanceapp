const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

// Send test email
async function sendTestEmail() {
  try {
    console.log('🧪 Sending test email from API endpoint...');

    const mailOptions = {
      from: `"SecureFinance Reports" <${process.env.EMAIL_USER}>`,
      to: 'roohithbalag.23csd@kongu.edu',
      replyTo: process.env.EMAIL_USER,
      subject: 'Test Report - User Reported via App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">User Report Test</h2>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Report Details:</h3>
            <p><strong>Reported User:</strong> testuser123 (ID: test-user-id)</p>
            <p><strong>Reported By:</strong> Test User (@testuser)</p>
            <p><strong>Report Reason:</strong> User reported via chat menu</p>
            <p><strong>Additional Details:</strong> User Test User was reported for inappropriate behavior.</p>
            <p><strong>Report Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Action Required:</h4>
            <p>This is a test email to verify the reporting system is working.</p>
          </div>

          <p style="color: #6c757d; font-size: 12px;">
            This is an automated message from SecureFinance App.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', info.messageId);
    console.log('📧 Email response:', info);

  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
sendTestEmail();