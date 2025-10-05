const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    required: true,
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v) || v === 'system';
      },
      message: props => `${props.value} is not a valid ObjectId or system ID`
    }
  },
  name: String,
  username: String,
  avatar: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: userInfoSchema,
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
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
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'system', 'command', 'split_bill'],
    default: 'text'
  },
  // For financial commands and AI features
  commandType: {
    type: String,
    enum: ['split', 'expense', 'budget', 'predict', 'summary', null],
    sparse: true
  },
  commandData: {
    // For split bills
    amount: Number,
    splitAmount: Number,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // For expenses
    category: String,
    description: String,
    // For predictions
    prediction: String,
    confidence: Number,
    // For budgets
    budgetCategory: String,
    budgetAmount: Number,
    // For summary
    periodStart: Date,
    periodEnd: Date,
    totalAmount: Number,
    itemCount: Number
  },
  // For system messages
  systemData: {
    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success']
    },
    code: String,
    details: mongoose.Schema.Types.Mixed
  },
  // For split bill messages
  splitBillData: {
    splitBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SplitBill'
    },
    description: String,
    totalAmount: Number,
    userShare: Number,
    isPaid: Boolean,
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      amount: Number,
      isPaid: Boolean
    }]
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

// Compound index for efficient group message queries
messageSchema.index({ groupId: 1, createdAt: -1 });

// Index for user's messages
messageSchema.index({ 'user._id': 1, createdAt: -1 });

// Index for read receipts
messageSchema.index({ 'readBy.userId': 1 });

// Index for status queries
messageSchema.index({ status: 1 });

// Text index for search
messageSchema.index({ text: 'text', 'commandData.description': 'text' });

// Virtual for formatted time
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString();
});

// Virtual for preview text
messageSchema.virtual('preview').get(function() {
  if (this.type === 'text') return this.text.substring(0, 50);
  if (this.type === 'image') return '📷 Image';
  if (this.type === 'file') return '📎 File';
  if (this.type === 'system') return '🤖 System Message';
  if (this.type === 'command') return `/${this.commandType} Command`;
  return 'Message';
});

// Methods
messageSchema.methods.isCommand = function() {
  return this.text.startsWith('@') || this.type === 'command';
};

messageSchema.methods.isSystemMessage = function() {
  return this.type === 'system';
};

messageSchema.methods.isMediaMessage = function() {
  return ['image', 'video', 'audio', 'document'].includes(this.type);
};

messageSchema.methods.markAsDelivered = async function() {
  this.status = 'delivered';
  return this.save();
};

messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.some(r => r.userId.toString() === userId.toString())) {
    this.readBy.push({ userId, readAt: new Date() });
    this.status = 'read';
    return this.save();
  }
  return this;
};

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;