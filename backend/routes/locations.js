const express = require('express');
const Location = require('../models/Location');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user locations with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const {
      page = 1,
      limit = 20,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.userId };

    if (category) query.category = category;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let locations;

    if (search) {
      // Use text search if search term provided
      locations = await Location.find(
        { ...query, $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' }, ...sortOptions })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'name avatar');
    } else {
      locations = await Location.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'name avatar');
    }

    const total = await Location.countDocuments(query);

    res.json({
      locations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby locations
router.get('/nearby', auth, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 1000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const locations = await Location.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance),
      req.userId
    );

    res.json({ locations });
  } catch (error) {
    console.error('Get nearby locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular locations
router.get('/popular', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const locations = await Location.getPopularLocations(req.userId, parseInt(limit));
    res.json({ locations });
  } catch (error) {
    console.error('Get popular locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get locations by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const validCategories = ['restaurant', 'store', 'entertainment', 'service', 'transport', 'healthcare', 'education', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const locations = await Location.getLocationsByCategory(category, req.userId, parseInt(limit));
    res.json({ locations });
  } catch (error) {
    console.error('Get locations by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single location
router.get('/:id', auth, async (req, res) => {
  try {
    const location = await Location.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { isPublic: true }
      ]
    }).populate('userId', 'name avatar');

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ location });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new location
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      address,
      coordinates,
      category,
      googlePlaceId,
      rating,
      priceLevel,
      phoneNumber,
      website,
      businessHours,
      photos,
      tags,
      isPublic,
      notes
    } = req.body;

    // Validation
    if (!name || !address || !coordinates) {
      return res.status(400).json({ message: 'Name, address, and coordinates are required' });
    }

    if (!coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({ message: 'Valid coordinates are required' });
    }

    // Check if location with same Google Place ID already exists for user
    if (googlePlaceId) {
      const existingLocation = await Location.findOne({
        googlePlaceId,
        userId: req.userId
      });

      if (existingLocation) {
        return res.status(400).json({ message: 'Location already exists for this user' });
      }
    }

    const location = new Location({
      name: name.trim(),
      address: address.trim(),
      coordinates: {
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      },
      category: category || 'other',
      googlePlaceId,
      rating: rating ? parseFloat(rating) : undefined,
      priceLevel: priceLevel ? parseInt(priceLevel) : undefined,
      phoneNumber: phoneNumber?.trim(),
      website: website?.trim(),
      businessHours,
      photos,
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [],
      userId: req.userId,
      isPublic: Boolean(isPublic),
      notes: notes?.trim()
    });

    await location.save();
    await location.populate('userId', 'name avatar');

    res.status(201).json({
      message: 'Location created successfully',
      location
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update location
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      address,
      coordinates,
      category,
      rating,
      priceLevel,
      phoneNumber,
      website,
      businessHours,
      photos,
      tags,
      isPublic,
      notes
    } = req.body;

    const location = await Location.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Update fields
    if (name !== undefined) location.name = name.trim();
    if (address !== undefined) location.address = address.trim();
    if (coordinates !== undefined) {
      location.coordinates = {
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      };
    }
    if (category !== undefined) location.category = category;
    if (rating !== undefined) location.rating = rating ? parseFloat(rating) : undefined;
    if (priceLevel !== undefined) location.priceLevel = priceLevel ? parseInt(priceLevel) : undefined;
    if (phoneNumber !== undefined) location.phoneNumber = phoneNumber?.trim();
    if (website !== undefined) location.website = website?.trim();
    if (businessHours !== undefined) location.businessHours = businessHours;
    if (photos !== undefined) location.photos = photos;
    if (tags !== undefined) {
      location.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [];
    }
    if (isPublic !== undefined) location.isPublic = Boolean(isPublic);
    if (notes !== undefined) location.notes = notes?.trim();

    await location.save();
    await location.populate('userId', 'name avatar');

    res.json({
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete location
router.delete('/:id', auth, async (req, res) => {
  try {
    const location = await Location.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record visit to location
router.post('/:id/visit', auth, async (req, res) => {
  try {
    const location = await Location.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { isPublic: true }
      ]
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    await location.recordVisit();

    res.json({
      message: 'Visit recorded successfully',
      location
    });
  } catch (error) {
    console.error('Record visit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add photo to location
router.post('/:id/photos', auth, async (req, res) => {
  try {
    const { url, width, height, attribution } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const location = await Location.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    await location.addPhoto({
      url,
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      attribution
    });

    res.json({
      message: 'Photo added successfully',
      location
    });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;