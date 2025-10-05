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
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'system', 'command', 'split_bill'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'error'],
    default: 'sent'
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
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
  // For media messages
  mediaUrl: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', null]
  },
  mediaSize: Number,
  mediaDuration: Number, // For audio/video in seconds
  mediaWidth: Number, // For images/videos
  mediaHeight: Number, // For images/videos
  thumbnailUrl: String, // For videos and large images
  fileName: String, // Original file name
  mimeType: String, // MIME type of the file
  // For message formatting
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create compound index for efficient querying of chats between users
directMessageSchema.index({ sender: 1, receiver: 1 });

// Index for read receipts
directMessageSchema.index({ 'readBy.userId': 1 });

// Index for status queries
directMessageSchema.index({ status: 1 });

// Text index for search
directMessageSchema.index({ text: 'text' });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
