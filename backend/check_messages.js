const mongoose = require('mongoose');
require('dotenv').config();

async function checkMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    console.log('Connected to MongoDB');

    const Message = require('./models/Message');
    const count = await Message.countDocuments();
    console.log('Total messages in database:', count);

    if (count > 0) {
      const messages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name username');

      console.log('Recent messages:');
      messages.forEach((msg, i) => {
        console.log(`${i + 1}. "${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}" by ${msg.user?.name || 'Unknown'} in group ${msg.groupId}`);
      });
    } else {
      console.log('No messages found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkMessages();