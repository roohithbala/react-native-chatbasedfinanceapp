const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');

/**
 * This script tests if messages are actually persisting in the database
 * Run this after sending a message to verify it was saved
 */

async function testMessagePersistence() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    console.log('✅ Connected\n');

    // Get the most recent messages
    console.log('📊 MOST RECENT MESSAGES (Last 10)\n' + '='.repeat(60));
    const recentMessages = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (recentMessages.length === 0) {
      console.log('⚠️  No messages found in database!');
    } else {
      recentMessages.forEach((msg, idx) => {
        const timeDiff = Date.now() - new Date(msg.createdAt).getTime();
        const timeAgo = timeDiff < 60000 
          ? `${Math.floor(timeDiff / 1000)}s ago`
          : timeDiff < 3600000
          ? `${Math.floor(timeDiff / 60000)}m ago`
          : `${Math.floor(timeDiff / 3600000)}h ago`;
        
        console.log(`\n${idx + 1}. [${msg.type}] ${timeAgo}`);
        console.log(`   Text: "${msg.text?.substring(0, 80)}"`);
        console.log(`   Group: ${msg.groupId || 'N/A'}`);
        console.log(`   User: ${msg.user?.name || 'Unknown'} (${msg.user?._id})`);
        console.log(`   ID: ${msg._id}`);
        console.log(`   Created: ${new Date(msg.createdAt).toLocaleString()}`);
      });
    }

    // Count messages by group
    console.log('\n\n📊 MESSAGES BY GROUP\n' + '='.repeat(60));
    const pipeline = [
      {
        $group: {
          _id: '$groupId',
          count: { $sum: 1 },
          lastMessage: { $max: '$createdAt' }
        }
      },
      {
        $sort: { lastMessage: -1 }
      },
      {
        $limit: 10
      }
    ];

    const messagesByGroup = await Message.aggregate(pipeline);
    
    for (const group of messagesByGroup) {
      const timeDiff = Date.now() - new Date(group.lastMessage).getTime();
      const lastMessageAgo = timeDiff < 60000 
        ? `${Math.floor(timeDiff / 1000)}s ago`
        : timeDiff < 3600000
        ? `${Math.floor(timeDiff / 60000)}m ago`
        : `${Math.floor(timeDiff / 3600000)}h ago`;

      console.log(`\nGroup: ${group._id || 'NULL'}`);
      console.log(`  Messages: ${group.count}`);
      console.log(`  Last activity: ${lastMessageAgo}`);
    }

    // Test a specific group (you can pass groupId as argument)
    if (process.argv[2]) {
      const testGroupId = process.argv[2];
      console.log(`\n\n📊 TESTING SPECIFIC GROUP: ${testGroupId}\n` + '='.repeat(60));
      
      const groupMessages = await Message.find({ groupId: testGroupId })
        .sort({ createdAt: 1 })
        .lean();
      
      console.log(`Total messages for this group: ${groupMessages.length}`);
      
      if (groupMessages.length > 0) {
        console.log('\nFirst 5 messages:');
        groupMessages.slice(0, 5).forEach((msg, idx) => {
          console.log(`  ${idx + 1}. [${msg.type}] "${msg.text?.substring(0, 50)}"`);
        });
        
        if (groupMessages.length > 5) {
          console.log(`\nLast 5 messages:`);
          groupMessages.slice(-5).forEach((msg, idx) => {
            console.log(`  ${idx + 1}. [${msg.type}] "${msg.text?.substring(0, 50)}"`);
          });
        }
      }
    } else {
      console.log('\n💡 Tip: Run with groupId to test specific group:');
      console.log('   node test-message-persistence.js <groupId>');
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testMessagePersistence();
