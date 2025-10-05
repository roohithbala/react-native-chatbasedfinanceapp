const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Search users by username
router.get('/search/username', auth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username query is required' });
    }

    const users = await User.find({
      username: new RegExp(username, 'i'),
      _id: { $ne: req.userId },
      isActive: true
    })
    .select('_id name username')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Search users by email or username
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ],
      isActive: true,
      _id: { $ne: req.userId } // Exclude current user
    })
    .select('name email username avatar')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('🔍 Getting user profile for ID:', req.params.id, 'type:', typeof req.params.id);
    
    // Validate the ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      console.log('❌ Invalid user ID parameter:', req.params.id);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id)
      .select('name email username avatar isActive lastSeen')
      .populate('groups', 'name avatar');

    if (!user) {
      console.log('❌ User not found for ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user._id, user.name);
    res.json({ user });
  } catch (error) {
    console.error('❌ Get user error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { notifications, biometric, darkMode, currency } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (biometric !== undefined) user.preferences.biometric = biometric;
    if (darkMode !== undefined) user.preferences.darkMode = darkMode;
    if (currency !== undefined) user.preferences.currency = currency;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;