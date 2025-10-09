const mongoose = require('mongoose');
const Message = require('./models/Message');
const SplitBill = require('./models/SplitBill');

async function checkRecentSplitAttempts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chatbasedfinance');
    console.log('✅ Connected to MongoDB\n');

    // Get recent @split messages
    console.log('📊 Recent @split command attempts:');
    console.log('=' .repeat(60));
    
    const splitMessages = await Message.find({ 
      text: { $regex: '@split', $options: 'i' } 
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    splitMessages.forEach((msg, idx) => {
      console.log(`\n${idx + 1}. Type: ${msg.type} | Status: ${msg.status || 'N/A'}`);
      console.log(`   Text: ${msg.text.substring(0, 60)}...`);
      console.log(`   Created: ${msg.createdAt}`);
      console.log(`   CommandType: ${msg.commandType || 'N/A'}`);
      console.log(`   Has splitBillData: ${!!msg.splitBillData}`);
      if (msg.splitBillData) {
        console.log(`   SplitBill ID: ${msg.splitBillData.splitBillId || msg.splitBillData._id}`);
      }
    });

    // Get recent system error messages
    console.log('\n\n📊 Recent system error messages:');
    console.log('=' .repeat(60));
    
    const errorMessages = await Message.find({ 
      type: 'system',
      text: { $regex: '❌ Error', $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    errorMessages.forEach((msg, idx) => {
      console.log(`\n${idx + 1}. ${msg.text.substring(0, 80)}`);
      console.log(`   Created: ${msg.createdAt}`);
    });

    // Check split bills created recently
    console.log('\n\n📊 Recent split bills created:');
    console.log('=' .repeat(60));
    
    const recentBills = await SplitBill.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentBills.forEach((bill, idx) => {
      console.log(`\n${idx + 1}. ${bill.description} - ₹${bill.totalAmount}`);
      console.log(`   ID: ${bill._id}`);
      console.log(`   Created: ${bill.createdAt}`);
      console.log(`   GroupId: ${bill.groupId || 'null'}`);
      console.log(`   Participants: ${bill.participants.length}`);
      bill.participants.forEach(p => {
        console.log(`     - ${p.userId}: ₹${p.amount} (Paid: ${p.isPaid}, Rejected: ${p.isRejected || false})`);
      });
    });

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRecentSplitAttempts();
