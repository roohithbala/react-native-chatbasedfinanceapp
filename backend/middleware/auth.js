const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No auth token provided for route:', req.path);
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    console.log('Verifying token for route:', req.path);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('Decoded token:', decoded);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      console.log('Invalid user or user not active:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token or user not found.' });
    }

    req.userId = user._id;
    req.user = user;
    console.log('Auth successful for user:', user._id);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

module.exports = auth;