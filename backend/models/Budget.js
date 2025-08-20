const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
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
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: [{
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      triggered: {
        type: Boolean,
        default: false
      },
      triggeredAt: Date
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
budgetSchema.index({ userId: 1, category: 1, period: 1 });
budgetSchema.index({ groupId: 1, category: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);