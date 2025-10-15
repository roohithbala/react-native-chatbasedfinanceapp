const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');

const configureDatabase = async () => {
  // MongoDB connection with local fallback
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance';

  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection URI:', mongoUri.replace(/:[^:]*@/, ':***@')); // Hide password in logs

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4
    });

    console.log('✅ Connected to MongoDB');

    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('🔄 Attempting to reconnect to MongoDB...');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected - attempting reconnection...');
      setTimeout(() => {
        mongoose.connect(mongoUri).catch(err => {
          console.error('❌ MongoDB reconnection failed:', err.message);
        });
      }, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    mongoose.connection.on('reconnectFailed', () => {
      console.error('❌ MongoDB reconnection failed - running in offline mode');
    });

    // Create initial data
    await createInitialData();

  } catch (err) {
    console.log('⚠️  MongoDB connection failed, running in offline mode');
    console.log('📝 Using in-memory data store for development');
    console.error('Connection error:', err.message);
    console.log('🔄 Will retry connection every 30 seconds...');

    // Retry connection every 30 seconds
    setInterval(async () => {
      try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully on retry');
      } catch (retryErr) {
        console.log('🔄 MongoDB retry failed, will try again in 30 seconds');
      }
    }, 30000);

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