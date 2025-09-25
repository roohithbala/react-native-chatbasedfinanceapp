const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['restaurant', 'cafe', 'bar', 'store', 'office', 'home', 'park', 'gym', 'hospital', 'school', 'other'],
    default: 'other'
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  visitCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient location searches
locationSchema.index({ userId: 1, name: 1 });
locationSchema.index({ coordinates: '2dsphere' });

// Update visit count when location is accessed
locationSchema.methods.incrementVisitCount = function() {
  this.visitCount += 1;
  return this.save();
};

module.exports = mongoose.model('Location', locationSchema);