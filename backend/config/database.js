const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');

const configureDatabase = async () => {
  // MongoDB connection with local fallback
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance';

  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection URI:', mongoUri);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');

    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Create initial data
    await createInitialData();

  } catch (err) {
    console.log('⚠️  MongoDB connection failed, running in offline mode');
    console.log('📝 Using in-memory data store for development');
    console.error('Connection error:', err.message);
    // Don't exit the process, continue with offline mode
  }
};

const createInitialData = async () => {
  try {
    // First, ensure all existing users have upiId
    await User.updateMany(
      { upiId: { $exists: false } },
      { $set: { upiId: 'default@paytm' } }
    );

    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('📝 Creating demo user...');
      const demoUser = new User({
        name: 'Demo User',
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'demo123',
        upiId: 'demo@paytm',
        isActive: true
      });

      await demoUser.save();
      console.log('✅ Demo user created');

      // Create demo groups
      const personalGroup = new Group({
        name: 'Personal',
        avatar: '👤',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{
          userId: demoUser._id,
          role: 'admin'
        }],
        budgets: []
      });

      const familyGroup = new Group({
        name: 'Family',
        avatar: '👨‍👩‍👧‍👦',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{
          userId: demoUser._id,
          role: 'admin'
        }],
        budgets: []
      });

      await personalGroup.save();
      await familyGroup.save();

      demoUser.groups = [personalGroup._id, familyGroup._id];
      await demoUser.save();

      console.log('✅ Demo groups created');
    }
  } catch (error) {
    console.error('Error creating initial data:', error);
  }
};

module.exports = configureDatabase;