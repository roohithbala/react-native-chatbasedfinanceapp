const mongoose = require('mongoose');
const SplitBill = require('./models/SplitBill');

async function checkSplitBills() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chatbasedfinance', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const count = await SplitBill.countDocuments();
    console.log('Total split bills in database:', count);

    if (count > 0) {
      const recent = await SplitBill.find().sort({ createdAt: -1 }).limit(3);
      console.log('Recent split bills:');
      recent.forEach((bill, i) => {
        console.log(`${i+1}. ${bill.description} - ₹${bill.totalAmount} - Group: ${bill.groupId || 'Direct'}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSplitBills();