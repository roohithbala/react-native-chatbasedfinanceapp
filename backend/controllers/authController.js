const User = require('../models/User');
const Group = require('../models/Group');
const {
  validateRegistrationData,
  validateLoginData,
  validateProfileUpdate,
  generateToken,
  checkUserExists,
  formatUserResponse
} = require('../utils/authUtils');

// Register new user
const register = async (userData) => {
  const { name, email, password, username, upiId } = userData;

  // Validate input data
  const validation = validateRegistrationData({ name, email, password, username, upiId });
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // Check if user already exists
  const userExists = await checkUserExists(email, username);
  if (userExists.exists) {
    throw new Error(userExists.message);
  }

  // Create user
  const user = new User({
    name,
    email,
    password,
    username,
    upiId,
    preferences: {
      notifications: true,
      biometric: false,
      darkMode: false,
      currency: 'INR'
    }
  });

  await user.save();

  // Create default groups
  const personalGroup = new Group({
    name: 'Personal',
    avatar: '👤',
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    members: [{
      userId: user._id,
      role: 'admin'
    }],
    budgets: []
  });

  const familyGroup = new Group({
    name: 'Family',
    avatar: '👨‍👩‍👧‍👦',
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    members: [{
      userId: user._id,
      role: 'admin'
    }],
    budgets: []
  });

  await Promise.all([
    personalGroup.save(),
    familyGroup.save()
  ]);

  // Add groups to user
  user.groups = [personalGroup._id, familyGroup._id];
  await user.save();

  // Generate JWT
  const token = generateToken(user._id);

  return {
    message: 'User created successfully',
    token,
    user: {
      ...formatUserResponse(user),
      groups: [personalGroup, familyGroup]
    }
  };
};

// Login user
const login = async (loginData) => {
  const { email, password } = loginData;

  // Validate input data
  const validation = validateLoginData({ email, password });
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // Find user and populate groups
  const user = await User.findOne({ email }).populate('groups');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Update last seen
  user.lastSeen = new Date();
  await user.save();

  // Generate JWT
  const token = generateToken(user._id);

  return {
    message: 'Login successful',
    token,
    user: formatUserResponse(user, true)
  };
};

// Get current user profile
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).populate('groups');
  if (!user) {
    throw new Error('User not found');
  }

  return {
    user: formatUserResponse(user, true)
  };
};

// Update user profile
const updateProfile = async (userId, updateData) => {
  const { name, avatar, preferences, email, username, upiId } = updateData;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Validate profile update data
  const validation = validateProfileUpdate({ email, username, upiId }, user);
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // Check if username is being changed and validate uniqueness
  if (username !== undefined && username !== user.username) {
    if (!username || username.trim() === '') {
      throw new Error('Username cannot be empty');
    }
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      throw new Error(`Username "${username.trim()}" is already taken by another user`);
    }
    user.username = username.trim();
  }

  // Check if email is being changed and validate uniqueness
  if (email !== undefined && email !== user.email) {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be empty');
    }
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      throw new Error(`Email "${email.trim()}" is already registered to another account`);
    }
    user.email = email.trim().toLowerCase();
  }

  // Check if upiId is being changed and validate uniqueness
  if (upiId !== undefined && upiId !== user.upiId) {
    if (!upiId || upiId.trim() === '') {
      throw new Error('UPI ID cannot be empty');
    }
    const existingUser = await User.findOne({ upiId: upiId.trim() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      throw new Error(`UPI ID "${upiId.trim()}" is already registered to another account`);
    }
    user.upiId = upiId.trim();
  }

  // Ensure upiId is always set (required field)
  if (!user.upiId) {
    throw new Error('UPI ID is required');
  }

  // Update other fields
  if (name !== undefined) user.name = name ? name.trim() : user.name;
  if (avatar !== undefined) user.avatar = avatar || user.avatar;
  if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  return {
    message: 'Profile updated successfully',
    user: formatUserResponse(user)
  };
};

// Logout user
const logout = async (userId) => {
  // Update last seen timestamp
  const user = await User.findById(userId);
  if (user) {
    user.lastSeen = new Date();
    await user.save();
  }

  return { message: 'Logged out successfully' };
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout
};