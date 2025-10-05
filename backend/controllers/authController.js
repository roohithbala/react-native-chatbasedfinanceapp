const User = require('../models/User');
const Group = require('../models/Group');
const { OAuth2Client } = require('google-auth-library');
const {
  validateRegistrationData,
  validateLoginData,
  validateProfileUpdate,
  generateToken,
  checkUserExists,
  formatUserResponse
} = require('../utils/authUtils');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  console.log('Register: Generating token for user._id:', user._id, 'type:', typeof user._id);
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
  const { email, password, username } = loginData;

  // Validate input data - accept either email or username
  if (!email && !username) {
    throw new Error('Email or username is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }

  // Find user by email or username and populate groups
  let user;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase() }).populate('groups');
  } else if (username) {
    user = await User.findOne({ username: username.trim() }).populate('groups');
  }

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
  console.log('Login: Generating token for user._id:', user._id, 'type:', typeof user._id);
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

// Google authentication
const googleAuth = async (idToken) => {
  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, update last seen and return token
      user.lastSeen = new Date();
      await user.save();

      console.log('Google login: Generating token for user._id:', user._id, 'type:', typeof user._id);
      const token = generateToken(user._id);
      return {
        message: 'Google login successful',
        token,
        user: formatUserResponse(user, true)
      };
    }

    // Check if user exists with same email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Link Google account to existing user
      existingUser.googleId = googleId;
      existingUser.lastSeen = new Date();
      if (!existingUser.avatar && picture) {
        existingUser.avatar = picture;
      }
      await existingUser.save();

      console.log('Google link: Generating token for existingUser._id:', existingUser._id, 'type:', typeof existingUser._id);
      const token = generateToken(existingUser._id);
      return {
        message: 'Google account linked successfully',
        token,
        user: formatUserResponse(existingUser, true)
      };
    }

    // Create new user
    const username = email.split('@')[0] + Math.random().toString(36).substring(2, 5);
    const upiId = username + '@google'; // Default UPI ID for Google users

    user = new User({
      name,
      email: email.toLowerCase(),
      username,
      upiId,
      googleId,
      avatar: picture,
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
    console.log('Google register: Generating token for user._id:', user._id, 'type:', typeof user._id);
    const token = generateToken(user._id);

    return {
      message: 'Google registration successful',
      token,
      user: {
        ...formatUserResponse(user),
        groups: [personalGroup, familyGroup]
      }
    };
  } catch (error) {
    console.error('Google auth error:', error);
    throw new Error('Google authentication failed');
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout,
  googleAuth
};