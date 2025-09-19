const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'cancelled'],
    default: 'not-started'
  },
  dueDate: {
    type: Date,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'General'
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
      default: 1,
      min: 1
    },
    endDate: Date
  },
  completedAt: {
    type: Date
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'in-app']
    },
    scheduledFor: Date,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ userId: 1, priority: 1 });
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ 'sharedWith.userId': 1 });

// Virtual for checking if todo is overdue
todoSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || !this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
todoSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const diffTime = this.dueDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to mark as completed
todoSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Instance method to mark as in progress
todoSchema.methods.markInProgress = function() {
  this.status = 'in-progress';
  return this.save();
};

// Static method to get todos by user with filters
todoSchema.statics.getUserTodos = function(userId, filters = {}) {
  const query = { userId };

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.category) query.category = filters.category;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  if (filters.dueBefore) query.dueDate = { $lte: filters.dueBefore };
  if (filters.dueAfter) query.dueDate = { ...query.dueDate, $gte: filters.dueAfter };

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name avatar')
    .populate('sharedWith.userId', 'name avatar');
};

// Static method to get overdue todos
todoSchema.statics.getOverdueTodos = function(userId) {
  return this.find({
    userId,
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  })
  .sort({ dueDate: 1 })
  .populate('userId', 'name avatar');
};

// Static method to get todos due soon
todoSchema.statics.getTodosDueSoon = function(userId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    userId,
    status: { $ne: 'completed' },
    dueDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
  .sort({ dueDate: 1 })
  .populate('userId', 'name avatar');
};

module.exports = mongoose.model('Todo', todoSchema);