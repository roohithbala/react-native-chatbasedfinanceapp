const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Participant user ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Participant amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date
}, { _id: false });

const splitBillSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    validate: {
      validator: Number.isFinite,
      message: 'Total amount must be a valid number'
    }
  },
  currency: {
    type: String,
    default: 'USD'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  }],
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'custom'],
    default: 'equal'
  },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
    default: 'Other'
  },
  receipt: {
    url: String,
    filename: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  isSettled: {
    type: Boolean,
    default: false
  },
  settledAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
splitBillSchema.index({ groupId: 1, createdAt: -1 });
splitBillSchema.index({ createdBy: 1, createdAt: -1 });
splitBillSchema.index({ 'participants.userId': 1 });

// Static methods for statistics
splitBillSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { createdBy: mongoose.Types.ObjectId(userId) },
          { 'participants.userId': mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$totalAmount' },
              count: { $sum: 1 },
              settled: {
                $sum: { $cond: ['$isSettled', 1, 0] }
              },
              pending: {
                $sum: { $cond: ['$isSettled', 0, 1] }
              }
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { amount: -1 } }
        ],
        recentActivity: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              description: 1,
              totalAmount: 1,
              createdAt: 1,
              isSettled: 1,
              category: 1
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0];
};

splitBillSchema.statics.getGroupStats = async function(groupId) {
  const stats = await this.aggregate([
    { $match: { groupId: mongoose.Types.ObjectId(groupId) } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$totalAmount' },
              count: { $sum: 1 },
              settledAmount: {
                $sum: { 
                  $cond: [
                    '$isSettled',
                    '$totalAmount',
                    0
                  ]
                }
              }
            }
          }
        ],
        byMember: [
          { $unwind: '$participants' },
          {
            $group: {
              _id: '$participants.userId',
              owes: { $sum: '$participants.amount' },
              paidCount: {
                $sum: { 
                  $cond: [
                    '$participants.isPaid',
                    1,
                    0
                  ]
                }
              },
              totalBills: { $sum: 1 }
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
              owes: 1,
              paidCount: 1,
              totalBills: 1
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { amount: -1 } }
        ]
      }
    }
  ]);

  return stats[0];
};

module.exports = mongoose.model('SplitBill', splitBillSchema);