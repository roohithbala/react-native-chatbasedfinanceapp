const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const SplitBill = require('./models/SplitBill');

async function checkMessagesAndSplitBills() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    console.log('✅ Connected to MongoDB\n');

    // Check Messages
    console.log('📊 CHECKING MESSAGES\n' + '='.repeat(50));
    const allMessages = await Message.find({}).lean();
    console.log(`Total messages in database: ${allMessages.length}\n`);

    if (allMessages.length === 0) {
      console.log('⚠️  No messages found in database!');
      console.log('This could mean:');
      console.log('  1. Messages are not being saved');
      console.log('  2. Database connection is to wrong database');
      console.log('  3. Collection name is different\n');
    } else {
      // Group by groupId
      const byGroup = {};
      allMessages.forEach(msg => {
        const gid = msg.groupId?.toString() || 'null';
        if (!byGroup[gid]) byGroup[gid] = [];
        byGroup[gid].push(msg);
      });

      console.log('Messages by Group:');
      Object.entries(byGroup).forEach(([groupId, msgs]) => {
        console.log(`\n📁 Group ID: ${groupId}`);
        console.log(`   Messages: ${msgs.length}`);
        msgs.slice(0, 5).forEach((msg, idx) => {
          console.log(`   ${idx + 1}. [${msg.type}] "${msg.text?.substring(0, 60)}..." (ID: ${msg._id})`);
          if (msg.splitBillData) {
            console.log(`      💰 Split Bill: ${msg.splitBillData.description} - ₹${msg.splitBillData.totalAmount}`);
          }
        });
        if (msgs.length > 5) {
          console.log(`   ... and ${msgs.length - 5} more messages`);
        }
      });

      // Check for messages with split_bill type
      const splitBillMessages = allMessages.filter(m => m.type === 'split_bill');
      console.log(`\n💰 Split Bill Messages: ${splitBillMessages.length}`);
      if (splitBillMessages.length > 0) {
        splitBillMessages.slice(0, 3).forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ${msg.text?.substring(0, 60)} (Group: ${msg.groupId})`);
        });
      }
    }

    // Check Split Bills
    console.log('\n\n📊 CHECKING SPLIT BILLS\n' + '='.repeat(50));
    const allSplitBills = await SplitBill.find({}).lean();
    console.log(`Total split bills in database: ${allSplitBills.length}\n`);

    if (allSplitBills.length === 0) {
      console.log('⚠️  No split bills found in database!');
    } else {
      // Group by groupId
      const splitByGroup = {};
      allSplitBills.forEach(sb => {
        const gid = sb.groupId?.toString() || 'null';
        if (!splitByGroup[gid]) splitByGroup[gid] = [];
        splitByGroup[gid].push(sb);
      });

      console.log('Split Bills by Group:');
      Object.entries(splitByGroup).forEach(([groupId, bills]) => {
        console.log(`\n📁 Group ID: ${groupId}`);
        console.log(`   Split Bills: ${bills.length}`);
        bills.slice(0, 3).forEach((bill, idx) => {
          console.log(`   ${idx + 1}. ${bill.description} - ₹${bill.totalAmount}`);
          console.log(`      Participants: ${bill.participants?.length || 0}`);
          console.log(`      Settled: ${bill.isSettled ? 'Yes' : 'No'}`);
        });
        if (bills.length > 3) {
          console.log(`   ... and ${bills.length - 3} more bills`);
        }
      });
    }

    // Check Collections
    console.log('\n\n📊 DATABASE COLLECTIONS\n' + '='.repeat(50));
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`  - ${coll.name}: ${count} documents`);
    }

    // Check Indexes
    console.log('\n\n📊 MESSAGE INDEXES\n' + '='.repeat(50));
    const messageIndexes = await Message.collection.getIndexes();
    console.log('Message collection indexes:');
    Object.entries(messageIndexes).forEach(([name, index]) => {
      console.log(`  - ${name}:`, index);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database check complete');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkMessagesAndSplitBills();
