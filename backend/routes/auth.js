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