const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Enable debug logging
  logger: true, // Enable logger
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('Full error:', error);
    console.log('🔄 Email system will retry on next report...');
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

// Monitor transporter events
transporter.on('error', (error) => {
  console.error('❌ Email transporter error:', error);
});

transporter.on('idle', () => {
  console.log('📧 Email transporter is idle');
});

// Report a user
router.post('/user', auth, async (req, res) => {
  try {
    console.log('📧 Report request received:', req.body);
    const { reportedUserId, reportedUsername, reason, description } = req.body;

    if (!reportedUserId || !reportedUsername) {
      return res.status(400).json({ message: 'Reported user information is required' });
    }

    // Get reporter information
    const reporter = await require('../models/User').findById(req.user._id);
    if (!reporter) {
      return res.status(404).json({ message: 'Reporter not found' });
    }

    console.log('📧 Reporter found:', reporter.name, reporter.email);

    // Prepare email content
    const mailOptions = {
      from: `"SecureFinance Reports" <${process.env.EMAIL_USER}>`,
      to: 'roohithbala18@gmail.com',
      replyTo: process.env.EMAIL_USER,
      subject: `User Report - ${reportedUsername} reported by ${reporter.username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">User Report Notification</h2>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Report Details:</h3>
            <p><strong>Reported User:</strong> ${reportedUsername} (ID: ${reportedUserId})</p>
            <p><strong>Reported By:</strong> ${reporter.name} (@${reporter.username})</p>
            <p><strong>Reporter Email:</strong> ${reporter.email}</p>
            <p><strong>Report Reason:</strong> ${reason || 'Not specified'}</p>
            <p><strong>Additional Details:</strong> ${description || 'No additional details provided'}</p>
            <p><strong>Report Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Action Required:</h4>
            <p>Please review this report and take appropriate action as needed.</p>
            <ul>
              <li>Investigate the reported user's behavior</li>
              <li>Check chat history and interactions</li>
              <li>Contact the reporter if additional information is needed</li>
              <li>Apply appropriate moderation actions if violations are confirmed</li>
            </ul>
          </div>

          <p style="color: #6c757d; font-size: 12px;">
            This is an automated message from SecureFinance App. Please do not reply to this email.
          </p>
        </div>
      `
    };

    console.log('📧 Sending email to:', mailOptions.to);
    console.log('📧 Email user:', process.env.EMAIL_USER);
    console.log('📧 Email pass exists:', !!process.env.EMAIL_PASS);

    // Send email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', info.messageId);
      console.log('📧 Email response:', info);
      console.log('✅ REPORT SUBMITTED SUCCESSFULLY - User reported:', reportedUsername, 'by', reporter.username);

      res.json({
        message: 'Report submitted successfully. Our team will review this report.',
        reportId: Date.now().toString(),
        emailInfo: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
        }
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('Full email error:', emailError);

      // Still return success for the report, but log the email failure
      res.json({
        message: 'Report submitted successfully, but email notification failed. Our team will still review this report.',
        reportId: Date.now().toString(),
        emailError: emailError.message
      });
    }

  } catch (error) {
    console.error('❌ Error submitting report:', error);
    res.status(500).json({ message: 'Failed to submit report. Please try again.' });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email functionality...');

    const mailOptions = {
      from: `"SecureFinance Test" <${process.env.EMAIL_USER}>`,
      to: 'roohithbala18@gmail.com',
      replyTo: process.env.EMAIL_USER,
      subject: 'Test Email from SecureFinance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">Test Email</h2>
          <p>This is a test email to verify that the email system is working.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
          <p>If you received this email, the reporting system should work!</p>
        </div>
      `
    };

    console.log('📧 Sending test email...');
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', info.messageId);
      console.log('📧 Email response:', info);

      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        emailInfo: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
        }
      });
    } catch (emailError) {
      console.error('❌ Test email failed:', emailError.message);
      console.error('Full email error:', emailError);

      res.status(500).json({
        success: false,
        message: 'Test email failed',
        error: emailError.message,
        details: emailError.toString()
      });
    }
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
});

module.exports = router;