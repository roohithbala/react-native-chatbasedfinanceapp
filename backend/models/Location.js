const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
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
  category: {
    type: String,
    enum: ['restaurant', 'store', 'entertainment', 'service', 'transport', 'healthcare', 'education', 'other'],
    default: 'other'
  },
  googlePlaceId: {
    type: String,
    sparse: true,
    index: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  priceLevel: {
    type: Number,
    min: 0,
    max: 4 // 0 = Free, 1 = Inexpensive, 2 = Moderate, 3 = Expensive, 4 = Very Expensive
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  businessHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open: String, // Format: "HH:MM"
    close: String, // Format: "HH:MM"
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  photos: [{
    url: String,
    width: Number,
    height: Number,
    attribution: String
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  visitCount: {
    type: Number,
    default: 0
  },
  lastVisited: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ userId: 1, category: 1 });
locationSchema.index({ userId: 1, createdAt: -1 });
locationSchema.index({ name: 'text', address: 'text' });

// Virtual for distance calculation (requires aggregation pipeline)
locationSchema.virtual('distance').get(function() {
  return this._distance || null;
});

// Instance method to update visit count
locationSchema.methods.recordVisit = function() {
  this.visitCount += 1;
  this.lastVisited = new Date();
  return this.save();
};

// Instance method to add photo
locationSchema.methods.addPhoto = function(photoData) {
  this.photos.push(photoData);
  return this.save();
};

// Static method to find nearby locations
locationSchema.statics.findNearby = function(longitude, latitude, maxDistance = 1000, userId = null) {
  const query = {
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  };

  if (userId) {
    query.userId = userId;
  }

  return this.find(query).populate('userId', 'name avatar');
};

// Static method to search locations by text
locationSchema.statics.searchLocations = function(searchTerm, userId = null, limit = 20) {
  const query = {
    $text: { $search: searchTerm }
  };

  if (userId) {
    query.userId = userId;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('userId', 'name avatar');
};

// Static method to get popular locations
locationSchema.statics.getPopularLocations = function(userId = null, limit = 10) {
  const query = userId ? { userId } : {};
  
  return this.find(query)
    .sort({ visitCount: -1, lastVisited: -1 })
    .limit(limit)
    .populate('userId', 'name avatar');
};

// Static method to get locations by category
locationSchema.statics.getLocationsByCategory = function(category, userId = null, limit = 20) {
  const query = { category };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query)
    .sort({ visitCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name avatar');
};

module.exports = mongoose.model('Location', locationSchema);