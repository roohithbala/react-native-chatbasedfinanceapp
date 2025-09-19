const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    max: 999999.99
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
    default: 'Other'
  },
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
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },
  locationDetails: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  receipt: {
    url: String,
    filename: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1
    }
  },
  emotionalContext: {
    mood: {
      type: String,
      enum: ['happy', 'sad', 'stressed', 'excited', 'neutral', 'anxious']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ userId: 1, createdAt: -1 });
expenseSchema.index({ groupId: 1, createdAt: -1 });
expenseSchema.index({ category: 1, createdAt: -1 });

// Static methods for statistics
expenseSchema.statics.getUserStats = async function(userId, period = 'month') {
  const now = new Date();
  let startDate;
  
  switch(period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1)); // Default to month
  }

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' },
              maxAmount: { $max: '$amount' },
              minAmount: { $min: '$amount' }
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' }
            }
          },
          { $sort: { amount: -1 } }
        ],
        byEmotionalContext: [
          {
            $group: {
              _id: '$emotionalContext.mood',
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' }
            }
          },
          { $sort: { amount: -1 } }
        ],
        dailyTrend: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ],
        recurringExpenses: [
          {
            $match: { isRecurring: true }
          },
          {
            $group: {
              _id: '$recurringPattern.frequency',
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  return stats[0];
};

expenseSchema.statics.getGroupStats = async function(groupId, period = 'month') {
  const now = new Date();
  let startDate = new Date(now.setMonth(now.getMonth() - 1));

  const stats = await this.aggregate([
    {
      $match: {
        groupId: new mongoose.Types.ObjectId(groupId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' }
            }
          }
        ],
        byMember: [
          {
            $group: {
              _id: '$userId',
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userDetails'
            }
          },
          {
            $project: {
              name: { $arrayElemAt: ['$userDetails.name', 0] },
              amount: 1,
              count: 1
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { amount: -1 } }
        ],
        dailyTrend: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]
      }
    }
  ]);

  return stats[0];
};

module.exports = mongoose.model('Expense', expenseSchema);