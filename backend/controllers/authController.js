const User = require('../models/User');
const Group = require('../models/Group');
const { OAuth2Client } = require('google-auth-library');
const {
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
} = require('../utils/authUtils');
const bcrypt = require('bcryptjs');
const {
  sendOTPEmail,
  sendPasswordResetConfirmationEmail,
  sendLoginSuccessEmail,
  sendLoginFailureEmail
} = require('../utils/emailService');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Utility: escape user input for RegExp
const escapeRegExp = (string) => {
  return String(string).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
};

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

// Login user - Now triggers OTP verification for all users
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
    user = await User.findOne({ username: new RegExp('^' + escapeRegExp(username.trim()) + '$', 'i') }).populate('groups');
  }

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Send login failure notification if we have the user's email
    try {
      if (user && user.email) {
        await sendLoginFailureEmail(user.email, user.name, 'Incorrect password');
      }
    } catch (e) {
      console.error('Error sending login failure email:', e);
    }

    throw new Error('Invalid credentials');
  }

  // Update last seen
  user.lastSeen = new Date();
  await user.save();

  // Generate and send OTP instead of returning token directly
  const otp = generateOTP();
  const otpExpires = generateOTPExpiry();

  // Hash OTP before saving
  try {
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    user.otp = otpHash;
    user.otpExpires = otpExpires;
    user.otpVerified = false;
    await user.save();
  } catch (e) {
    console.error('Failed to hash/save OTP:', e);
    throw new Error('Failed to generate OTP');
  }

  // Send OTP via email
  const emailSent = await sendOTPEmail(user.email, otp, 'login');
  if (!emailSent) {
    console.error('Failed to send OTP email to:', user.email);
    // Still proceed but log the error - don't fail the login
  }

  // TODO: Send OTP via email service (for now, just log it)
  console.log(`OTP for ${user.email}: ${otp} (expires at ${otpExpires})`);

  // In production, you would send this via email service like SendGrid, AWS SES, etc.
  return {
    message: 'OTP sent to your email. Please verify to complete login.',
    requiresOTP: true,
    email: user.email,
    otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only return OTP in development
    expiresIn: '10 minutes'
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
    const existingUser = await User.findOne({ username: new RegExp('^' + escapeRegExp(username.trim()) + '$', 'i') });
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
    console.log('Starting Google authentication...');

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not configured');
      throw new Error('Google OAuth not configured on server');
    }

    console.log('Verifying Google ID token...');
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.error('Invalid Google token payload');
      throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;
    console.log('Google user info:', { googleId, email, name });

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, update last seen and return token
      user.lastSeen = new Date();
      await user.save();

      console.log('Google login: Generating token for user._id:', user._id, 'type:', typeof user._id);
      const token = generateToken(user._id);
      try {
        if (user && user.email) {
          await sendLoginSuccessEmail(user.email, user.name, {});
        }
      } catch (e) {
        console.error('Error sending login success email (google existing user):', e);
      }
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
      try {
        if (existingUser && existingUser.email) {
          await sendLoginSuccessEmail(existingUser.email, existingUser.name, {});
        }
      } catch (e) {
        console.error('Error sending login success email (google linked user):', e);
      }
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
    try {
      if (user && user.email) {
        await sendLoginSuccessEmail(user.email, user.name, {});
      }
    } catch (e) {
      console.error('Error sending login success email (google new user):', e);
    }

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
    throw new Error('Google authentication failed: ' + error.message);
  }
};

// Send OTP to user's email or username
const sendOTP = async (identifier) => {
  try {
    console.log('Sending OTP to identifier:', identifier);

    // Try to find user by email or username
    let user = null;
    if (identifier && identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      user = await User.findOne({ username: new RegExp('^' + escapeRegExp(identifier.trim()) + '$', 'i') });
    }

    // Fallback: try the other field
    if (!user) {
      user = await User.findOne({ email: identifier.toLowerCase() }) || await User.findOne({ username: new RegExp('^' + escapeRegExp(identifier.trim()) + '$', 'i') });
    }

    if (!user) {
      throw new Error('User not found');
    }

    const email = user.email; // ensure we send to user's registered email

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = generateOTPExpiry();

    // Hash and save OTP to user
    try {
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otp, salt);
      user.otp = otpHash;
      user.otpExpires = otpExpires;
      user.otpVerified = false;
      await user.save();
    } catch (e) {
      console.error('Failed to hash/save OTP for sendOTP:', e);
      throw new Error('Failed to generate OTP');
    }

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp, 'login');
    if (!emailSent) {
      throw new Error('Failed to send OTP email. Please try again.');
    }

    console.log(`OTP for ${email}: ${otp} (expires at ${otpExpires})`);

    return {
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      expiresIn: '10 minutes'
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    throw new Error('Failed to send OTP: ' + error.message);
  }
};

// Verify OTP - accepts email or username as identifier
const verifyOTP = async (identifier, otp) => {
  try {
    console.log('Verifying OTP for identifier:', identifier);

    // Try to find user by email or username
    let user = null;
    if (identifier && identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      user = await User.findOne({ username: new RegExp('^' + escapeRegExp(identifier.trim()) + '$', 'i') });
    }

    // Fallback: try the other field (case-insensitive username)
    if (!user) {
      user = await User.findOne({ email: identifier.toLowerCase() }) || await User.findOne({ username: new RegExp('^' + escapeRegExp(identifier.trim()) + '$', 'i') });
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Verify OTP (verifyOTPUtil is async now)
    const verification = await verifyOTPUtil(otp, user.otp, user.otpExpires);
    if (!verification.valid) {
      // Notify user of failed login attempt (invalid OTP)
      try {
        if (user && user.email) {
          await sendLoginFailureEmail(user.email, user.name, verification.message);
        }
      } catch (e) {
        console.error('Error sending login failure email on OTP failure:', e);
      }

      throw new Error(verification.message);
    }

    // Clear OTP after successful verification
    await clearOTP(user);

    return {
      message: 'OTP verified successfully',
      verified: true
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw new Error(error.message);
  }
};

// OTP Login - accepts either email or username as identifier
const otpLogin = async (identifier, otp) => {
  try {
    console.log('OTP login for identifier:', identifier);
    console.log('User provided OTP:', otp, 'Type:', typeof otp);

    // Determine whether identifier is an email or username
    let user = null;
    if (identifier && identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() }).populate('groups');
    } else {
      user = await User.findOne({ username: new RegExp('^' + escapeRegExp(identifier.trim()) + '$', 'i') }).populate('groups');
    }

    // Fallback: try the other field if not found
    if (!user) {
      // Try email search (in case username was passed as an email or case differences)
      try {
        user = await User.findOne({ email: identifier.toLowerCase() }).populate('groups');
      } catch (e) {
        // ignore
      }
    }

    if (!user) {
      throw new Error('User not found');
    }

    console.log('Stored OTP:', user.otp, 'Type:', typeof user.otp);
    console.log('OTP expires:', user.otpExpires);
    console.log('Current time:', new Date());

    // Verify OTP (await async util)
    const verification = await verifyOTPUtil(otp, user.otp, user.otpExpires);
    console.log('OTP verification result:', verification);

    if (!verification.valid) {
      throw new Error(verification.message);
    }

    // Clear OTP after successful login
    await clearOTP(user);

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT
    console.log('OTP login: Generating token for user._id:', user._id, 'type:', typeof user._id);
    const token = generateToken(user._id);

    // Send login success notification (best-effort)
    try {
      if (user && user.email) {
        await sendLoginSuccessEmail(user.email, user.name, {});
      }
    } catch (e) {
      console.error('Error sending login success email:', e);
    }

    return {
      message: 'OTP login successful',
      token,
      user: formatUserResponse(user, true)
    };
  } catch (error) {
    console.error('OTP login error:', error);
    throw new Error(error.message);
  }
};

// Forgot Password - Send reset OTP
const forgotPassword = async (email) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('No account found with this email address');
    }

    // Generate reset OTP
    const resetOTP = generateOTP();
    const resetOTPExpiry = generateOTPExpiry();

    // Hash reset OTP and save to user
    try {
      const salt = await bcrypt.genSalt(10);
      const resetHash = await bcrypt.hash(resetOTP, salt);
      user.resetOTP = resetHash;
      user.resetOTPExpiry = resetOTPExpiry;
      await user.save();
    } catch (e) {
      console.error('Failed to hash/save reset OTP:', e);
      throw new Error('Failed to generate reset OTP');
    }

    // Send reset OTP email
    await sendOTPEmail(email, resetOTP, 'password reset');

    return {
      message: 'Password reset OTP sent to your email',
      email: email
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new Error(error.message);
  }
};

// Verify Reset OTP
const verifyResetOTP = async (email, otp) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if OTP matches and is not expired (resetOTP is stored hashed)
    if (!user.resetOTP) {
      throw new Error('Invalid OTP');
    }

    if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
      throw new Error('OTP expired');
    }

    const match = await bcrypt.compare(String(otp), String(user.resetOTP));
    if (!match) {
      throw new Error('Invalid OTP');
    }

    // Generate reset token (can be user ID + timestamp for simplicity)
    const resetToken = `${user._id}_${Date.now()}`;

    // Clear the OTP
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    return {
      message: 'OTP verified successfully',
      resetToken: resetToken
    };
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    throw new Error(error.message);
  }
};

// Reset Password
const resetPassword = async (resetToken, newPassword) => {
  try {
    // Parse reset token (userId_timestamp)
    const [userId, timestamp] = resetToken.split('_');

    if (!userId || !timestamp) {
      throw new Error('Invalid reset token');
    }

    // Check if token is not too old (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      throw new Error('Reset token expired');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send password reset confirmation (best-effort)
    try {
      if (user && user.email) {
        await sendPasswordResetConfirmationEmail(user.email, user.name);
      }
    } catch (e) {
      console.error('Error sending password reset confirmation email:', e);
    }

    return {
      message: 'Password reset successfully'
    };
  } catch (error) {
    console.error('Reset password error:', error);
    throw new Error(error.message);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout,
  googleAuth,
  sendOTP,
  verifyOTP,
  otpLogin,
  forgotPassword,
  verifyResetOTP,
  resetPassword
};