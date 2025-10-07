require('dotenv').config();
const mongoose = require('mongoose');

async function checkMediaUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    console.log('Connected to database');

    const DirectMessage = require('./models/DirectMessage');
    const Message = require('./models/Message');

    console.log('\n=== DirectMessage mediaUrls ===');
    const directMessages = await DirectMessage.find({mediaUrl: {$exists: true}}).limit(3);
    directMessages.forEach((msg, i) => {
      console.log(`${i+1}. mediaUrl: "${msg.mediaUrl}"`);
    });

    console.log('\n=== Message mediaUrls ===');
    const messages = await Message.find({mediaUrl: {$exists: true}}).limit(3);
    messages.forEach((msg, i) => {
      console.log(`${i+1}. mediaUrl: "${msg.mediaUrl}"`);
    });

    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMediaUrls();