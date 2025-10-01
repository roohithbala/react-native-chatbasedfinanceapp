const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['ringing', 'connecting', 'connected', 'ended', 'missed'],
    default: 'ringing'
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: null
    },
    leftAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['invited', 'joined', 'declined', 'left'],
      default: 'invited'
    }
  }],
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
callSchema.index({ 'participants.userId': 1 });
callSchema.index({ initiator: 1 });
callSchema.index({ groupId: 1 });
callSchema.index({ status: 1 });
callSchema.index({ createdAt: -1 });

// Virtual for call duration calculation
callSchema.virtual('calculatedDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return 0;
});

// Method to add participant
callSchema.methods.addParticipant = function(userId) {
  if (!this.participants.some(p => p.userId.equals(userId))) {
    this.participants.push({
      userId,
      status: 'invited'
    });
  }
  return this.save();
};

// Method to update participant status
callSchema.methods.updateParticipantStatus = function(userId, status, joinedAt = null, leftAt = null) {
  const participant = this.participants.find(p => p.userId.equals(userId));
  if (participant) {
    participant.status = status;
    if (joinedAt) participant.joinedAt = joinedAt;
    if (leftAt) participant.leftAt = leftAt;
    return this.save();
  }
  throw new Error('Participant not found in call');
};

// Method to end call
callSchema.methods.endCall = function() {
  this.status = 'ended';
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.save();
};

// Static method to find active calls for user
callSchema.statics.findActiveCallsForUser = function(userId) {
  return this.find({
    'participants.userId': userId,
    status: { $in: ['ringing', 'connecting', 'connected'] }
  }).populate('participants.userId', 'name username avatar')
    .populate('initiator', 'name username avatar')
    .populate('groupId', 'name');
};

// Static method to get call history for user
callSchema.statics.getCallHistoryForUser = function(userId, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { initiator: userId },
      { 'participants.userId': userId }
    ],
    status: 'ended'
  })
  .populate('participants.userId', 'name username avatar')
  .populate('initiator', 'name username avatar')
  .populate('groupId', 'name')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

module.exports = mongoose.model('Call', callSchema);