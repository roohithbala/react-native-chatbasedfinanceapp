const mongoose = require('mongoose');
const SplitBill = require('./models/SplitBill');
require('dotenv').config();

async function testSplitBillCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    console.log('Connected to MongoDB');

    // Create a test split bill
    const testSplitBill = {
      description: 'Test split bill',
      totalAmount: 100,
      groupId: null, // Direct chat
      participants: [
        {
          userId: new mongoose.Types.ObjectId(), // Mock user ID
          amount: 50,
          isPaid: false
        },
        {
          userId: new mongoose.Types.ObjectId(), // Mock user ID
          amount: 50,
          isPaid: true // Creator paid
        }
      ],
      splitType: 'equal',
      category: 'Food',
      currency: 'INR',
      createdBy: new mongoose.Types.ObjectId() // Mock user ID
    };

    console.log('Creating split bill with data:', JSON.stringify(testSplitBill, null, 2));

    const splitBill = new SplitBill(testSplitBill);
    await splitBill.save();

    console.log('Split bill created successfully:', splitBill._id);

    // Test populate
    await splitBill.populate('createdBy', 'name avatar');
    await splitBill.populate('participants.userId', 'name avatar');

    console.log('Split bill populated successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSplitBillCreation();