const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
    maxlength: 10
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: '👥'
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  budgets: [{
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    splitMethod: {
      type: String,
      enum: ['equal', 'percentage', 'custom'],
      default: 'equal'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Group', groupSchema);