const mongoose = require('mongoose');

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
    default: 'INR'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
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
    paidAt: Date,
    isRejected: {
      type: Boolean,
      default: false
    },
    rejectedAt: Date
  }],
  payments: [{
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'bhim_upi', 'other'],
      default: 'cash'
    },
    notes: String,
    paidAt: {
      type: Date,
      default: Date.now
    },
    confirmedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      confirmedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  reminders: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['payment_due', 'settlement_reminder', 'overdue_payment'],
      required: true
    },
    message: String,
    scheduledFor: {
      type: Date,
      required: true
    },
    sentAt: {
      type: Date,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    escalationLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    }
  }],
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'custom', 'itemized'],
    default: 'equal'
  },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
    default: 'Other'
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }]
  }],
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
  settledAt: Date,
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date,
  cancelReason: String
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
          { createdBy: new mongoose.Types.ObjectId(userId) },
          { 'participants.userId': new mongoose.Types.ObjectId(userId) }
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
  if (!groupId) {
    // For direct chat split bills, return empty stats or handle differently
    return {
      totals: [],
      byMember: [],
      byCategory: []
    };
  }

  const stats = await this.aggregate([
    { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
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

// Instance methods
splitBillSchema.methods.markParticipantAsPaid = async function(participantUserId, paymentMethod = 'cash', notes = '') {
  const participant = this.participants.find(p => p.userId.toString() === participantUserId.toString());
  
  if (!participant) {
    throw new Error('Participant not found in this split bill');
  }

  if (participant.isPaid) {
    throw new Error('Participant has already paid');
  }

  participant.isPaid = true;
  participant.paidAt = new Date();

  // Record the payment
  this.payments.push({
    fromUserId: participant.userId,
    toUserId: this.createdBy,
    amount: participant.amount,
    paymentMethod,
    notes,
    paidAt: new Date(),
    confirmedBy: [{
      userId: this.createdBy,
      confirmedAt: new Date()
    }]
  });

  // Check if all participants have paid
  const allPaid = this.participants.every(p => p.isPaid);
  if (allPaid && !this.isSettled) {
    this.isSettled = true;
    this.settledAt = new Date();
  }

  return this.save();
};

splitBillSchema.methods.confirmPayment = async function(paymentId, confirmerUserId) {
  const payment = this.payments.id(paymentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Check if user has already confirmed
  const alreadyConfirmed = payment.confirmedBy.some(c => c.userId.toString() === confirmerUserId.toString());
  
  if (alreadyConfirmed) {
    throw new Error('Payment already confirmed by this user');
  }

  payment.confirmedBy.push({
    userId: confirmerUserId,
    confirmedAt: new Date()
  });

  return this.save();
};

splitBillSchema.methods.addReminder = async function(userId, type, message) {
  this.reminders.push({
    userId,
    type,
    message,
    sentAt: new Date(),
    isRead: false
  });

  return this.save();
};

splitBillSchema.methods.getPaymentSummary = function() {
  const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOwed = this.participants.reduce((sum, participant) => sum + participant.amount, 0);
  
  // Calculate balance for the current user (creator perspective)
  const currentUserId = this.createdBy.toString();
  const userPaid = this.payments
    .filter(p => p.fromUserId.toString() === currentUserId)
    .reduce((sum, p) => sum + p.amount, 0);
  const userOwed = this.participants
    .filter(p => p.userId.toString() === currentUserId)
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = userPaid - userOwed;
  
  // Build detailed participant information
  const participants = this.participants.map(participant => {
    const participantPaid = this.payments
      .filter(p => p.fromUserId.toString() === participant.userId.toString())
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      userId: participant.userId._id || participant.userId,
      name: participant.userId.name || 'Unknown User',
      amountOwed: participant.amount,
      amountPaid: participantPaid,
      balance: participantPaid - participant.amount,
      isPaid: participant.isPaid
    };
  });
  
  return {
    totalPaid,
    totalOwed,
    balance,
    participants,
    totalAmount: this.totalAmount,
    remainingAmount: this.totalAmount - totalPaid,
    isFullyPaid: totalPaid >= this.totalAmount,
    participantsPaid: this.participants.filter(p => p.isPaid).length,
    totalParticipants: this.participants.length,
    payments: this.payments
  };
};

splitBillSchema.methods.getDebts = function() {
  const debts = [];
  
  this.participants.forEach(participant => {
    if (!participant.isPaid) {
      debts.push({
        fromUserId: participant.userId._id || participant.userId,
        toUserId: this.createdBy._id || this.createdBy,
        fromUserName: participant.userId.name || 'Unknown User',
        toUserName: this.createdBy.name || 'Unknown User',
        amount: participant.amount,
        description: this.description
      });
    }
  });

  return debts;
};

// Static methods for settlement calculations
splitBillSchema.statics.calculateGroupSettlement = async function(groupId) {
  if (!groupId) {
    // For direct chat split bills, return empty settlements
    return {
      settlements: [],
      memberBalances: {}
    };
  }

  const splitBills = await this.find({ 
    groupId,
    isSettled: false 
  }).populate('participants.userId', 'name');

  const memberBalances = new Map();
  const memberNames = new Map();
  
  // Calculate net balance for each member
  for (const bill of splitBills) {
    // Creator paid the full amount initially
    const creatorBalance = memberBalances.get(bill.createdBy.toString()) || 0;
    memberBalances.set(bill.createdBy.toString(), creatorBalance + bill.totalAmount);
    memberNames.set(bill.createdBy.toString(), bill.createdByName || 'Unknown');

    // Subtract each participant's share
    for (const participant of bill.participants) {
      const participantBalance = memberBalances.get(participant.userId.toString()) || 0;
      memberBalances.set(participant.userId.toString(), participantBalance - participant.amount);
      memberNames.set(participant.userId.toString(), participant.userId.name || 'Unknown');
    }
  }

  // Calculate settlements (who owes whom)
  const settlements = [];
  const members = Array.from(memberBalances.entries());
  
  // Sort by balance (most positive first)
  members.sort((a, b) => b[1] - a[1]);
  
  let i = 0;
  let j = members.length - 1;
  
  while (i < j) {
    const [creditorId, creditorBalance] = members[i];
    const [debtorId, debtorBalance] = members[j];
    
    if (creditorBalance === 0) {
      i++;
      continue;
    }
    
    if (debtorBalance === 0) {
      j--;
      continue;
    }
    
    const settlementAmount = Math.min(creditorBalance, Math.abs(debtorBalance));
    
    settlements.push({
      fromUserId: debtorId,
      toUserId: creditorId,
      amount: settlementAmount,
      fromUserName: memberNames.get(debtorId) || 'Unknown',
      toUserName: memberNames.get(creditorId) || 'Unknown'
    });
    
    members[i][1] -= settlementAmount;
    members[j][1] += settlementAmount;
  }

  return {
    settlements,
    memberBalances: Object.fromEntries(memberBalances)
  };
};

module.exports = mongoose.model('SplitBill', splitBillSchema);