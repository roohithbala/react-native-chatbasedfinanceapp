const express = require('express');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const result = await authController.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    const statusCode = error.message.includes('already') ? 400 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const result = await authController.login(req.body);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    const statusCode = error.message === 'Invalid credentials' ? 401 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Google authentication
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        message: 'Google ID token is required'
      });
    }

    const result = await authController.googleAuth(idToken);
    res.json(result);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const result = await authController.sendOTP(email);
    res.json(result);
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const result = await authController.verifyOTP(email, otp);
    res.json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Forgot Password - Send reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const result = await authController.forgotPassword(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Verify Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const result = await authController.verifyResetOTP(email, otp);
    res.json(result);
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    const statusCode = error.message === 'Invalid OTP' || error.message === 'OTP expired' ? 401 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: 'Reset token and new password are required'
      });
    }

    const result = await authController.resetPassword(resetToken, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    const statusCode = error.message === 'Invalid or expired reset token' ? 401 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// OTP Login
router.post('/otp-login', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const result = await authController.otpLogin(email, otp);
    res.json(result);
  } catch (error) {
    console.error('OTP login error:', error);
    const statusCode = error.message === 'Invalid OTP' || error.message === 'OTP expired' ? 401 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await authController.getCurrentUser(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Get user error:', error);
    const statusCode = error.message === 'User not found' ? 404 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const result = await authController.updateProfile(req.userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    const statusCode = error.message.includes('already') || error.message.includes('must be') ? 400 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    const result = await authController.logout(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;