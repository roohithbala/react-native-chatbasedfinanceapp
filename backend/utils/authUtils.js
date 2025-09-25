const jwt = require('jsonwebtoken');

// Validate registration data
const validateRegistrationData = (data) => {
  const { name, email, password, username, upiId } = data;
  const errors = [];

  if (!name || !email || !password || !username || !upiId) {
    errors.push('All fields are required');
  }

  if (username && username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  if (upiId && !/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/.test(upiId)) {
    errors.push('Invalid UPI ID format. UPI ID should be in format: username@bankname');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate login data
const validateLoginData = (data) => {
  const { email, password } = data;
  const errors = [];

  if (!email || !password) {
    errors.push('Email and password are required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate profile update data
const validateProfileUpdate = (data, currentUser) => {
  const { username, email } = data;
  const errors = [];

  // Check username
  if (username && username !== currentUser.username) {
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username must be at least 3 characters and can only contain letters, numbers, and underscores');
    }
  }

  // Check email
  if (email && email !== currentUser.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Check if user exists by email or username
const checkUserExists = async (email, username) => {
  const existingUser = await require('../models/User').findOne({
    $or: [{ email }, { username }]
  });

  if (!existingUser) {
    return { exists: false };
  }

  if (existingUser.email === email) {
    return { exists: true, field: 'email', message: 'Email already registered' };
  }

  return { exists: true, field: 'username', message: 'Username already taken' };
};

// Format user response (exclude sensitive data)
const formatUserResponse = (user, includeGroups = false) => {
  const baseUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    preferences: user.preferences
  };

  if (includeGroups) {
    baseUser.groups = user.groups;
  }

  return baseUser;
};

module.exports = {
  validateRegistrationData,
  validateLoginData,
  validateProfileUpdate,
  generateToken,
  checkUserExists,
  formatUserResponse
};