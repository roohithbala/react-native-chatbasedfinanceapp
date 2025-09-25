const express = require('express');
const auth = require('../middleware/auth');
const locationController = require('../controllers/locationController');

const router = express.Router();

// Get user locations with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const result = await locationController.getUserLocations(req.userId, req.query);

    res.json(result);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby locations
router.get('/nearby', auth, async (req, res) => {
  try {
    const result = await locationController.getNearbyLocations(req.userId, req.query);

    res.json(result);
  } catch (error) {
    console.error('Get nearby locations error:', error);
    const statusCode = error.message.includes('required') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Get popular locations
router.get('/popular', auth, async (req, res) => {
  try {
    const result = await locationController.getPopularLocations(req.userId, req.query.limit);

    res.json(result);
  } catch (error) {
    console.error('Get popular locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get locations by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const result = await locationController.getLocationsByCategory(
      req.params.category,
      req.userId,
      req.query.limit
    );

    res.json(result);
  } catch (error) {
    console.error('Get locations by category error:', error);
    const statusCode = error.message === 'Invalid category' ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Get single location
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await locationController.getLocationById(req.params.id, req.userId);

    res.json(result);
  } catch (error) {
    console.error('Get location error:', error);
    const statusCode = error.message === 'Location not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Create new location
router.post('/', auth, async (req, res) => {
  try {
    const location = await locationController.createLocation(req.userId, req.body);

    res.status(201).json({
      message: 'Location created successfully',
      location
    });
  } catch (error) {
    console.error('Create location error:', error);
    const statusCode = error.message.includes('required') || error.message.includes('already exists') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Update location
router.put('/:id', auth, async (req, res) => {
  try {
    const location = await locationController.updateLocation(req.params.id, req.userId, req.body);

    res.json({
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    console.error('Update location error:', error);
    const statusCode = error.message === 'Location not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Delete location
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await locationController.deleteLocation(req.params.id, req.userId);

    res.json(result);
  } catch (error) {
    console.error('Delete location error:', error);
    const statusCode = error.message === 'Location not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Record visit to location
router.post('/:id/visit', auth, async (req, res) => {
  try {
    const location = await locationController.recordLocationVisit(req.params.id, req.userId);

    res.json({
      message: 'Visit recorded successfully',
      location
    });
  } catch (error) {
    console.error('Record visit error:', error);
    const statusCode = error.message === 'Location not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Add photo to location
router.post('/:id/photos', auth, async (req, res) => {
  try {
    const location = await locationController.addLocationPhoto(req.params.id, req.userId, req.body);

    res.json({
      message: 'Photo added successfully',
      location
    });
  } catch (error) {
    console.error('Add photo error:', error);
    const statusCode = error.message === 'Location not found' || error.message.includes('required') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

module.exports = router;