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
  const { username, email, upiId } = data;
  const errors = [];

  // Check username
  if (username !== undefined && username !== currentUser.username) {
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username must be at least 3 characters and can only contain letters, numbers, and underscores');
    }
  }

  // Check email
  if (email !== undefined && email !== currentUser.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }
  }

  // Check UPI ID
  if (upiId !== undefined && upiId !== currentUser.upiId) {
    if (!upiId || upiId.trim() === '') {
      errors.push('UPI ID is required');
    } else if (!/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/.test(upiId)) {
      errors.push('Invalid UPI ID format. UPI ID should be in format: username@bankname');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate JWT token
const generateToken = (userId) => {
  if (!userId || userId === 'undefined') {
    throw new Error('Invalid userId provided to generateToken');
  }
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
    upiId: user.upiId,
    avatar: user.avatar,
    preferences: user.preferences
  };

  if (includeGroups) {
    baseUser.groups = user.groups;
  }

  return baseUser;
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate OTP expiry time (10 minutes from now)
const generateOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

const bcrypt = require('bcryptjs');

// Verify OTP (supports hashed stored OTP)
const verifyOTPUtil = async (inputOTP, storedOTPHash, expiryTime) => {
  if (!storedOTPHash) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  if (!expiryTime || new Date() > expiryTime) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  try {
    const match = await bcrypt.compare(String(inputOTP), String(storedOTPHash));
    if (!match) {
      return { valid: false, message: 'Invalid OTP. Please check and try again.' };
    }
    return { valid: true, message: 'OTP verified successfully' };
  } catch (err) {
    console.error('Error comparing OTP hash:', err);
    return { valid: false, message: 'OTP verification failed' };
  }
};

// Clear OTP after successful verification
const clearOTP = async (user) => {
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpVerified = true;
  await user.save();
};

module.exports = {
  validateRegistrationData,
  validateLoginData,
  validateProfileUpdate,
  generateToken,
  checkUserExists,
  formatUserResponse,
  generateOTP,
  generateOTPExpiry,
  verifyOTPUtil,
  clearOTP
};