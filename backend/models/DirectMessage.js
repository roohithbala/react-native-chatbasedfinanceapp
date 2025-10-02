const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  splitBillData: {
    _id: String,
    description: String,
    totalAmount: Number,
    participants: [{
      userId: {
        _id: String,
        name: String,
        username: String
      },
      amount: Number,
      isPaid: Boolean,
      paidAt: Date
    }],
    isSettled: Boolean
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying of chats between users
directMessageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
