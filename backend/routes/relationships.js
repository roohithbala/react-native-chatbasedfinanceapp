const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Block a user
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.userId);
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    if (currentUser.blockedUsers.includes(req.params.userId)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    currentUser.blockedUsers.push(req.params.userId);
    await currentUser.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Error blocking user' });
  }
});

// Unblock a user
router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== req.params.userId
    );
    await currentUser.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Error unblocking user' });
  }
});

// Mute a chat (direct message)
router.post('/mute/chat/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.mutedChats.includes(req.params.userId)) {
      currentUser.mutedChats.push(req.params.userId);
      await currentUser.save();
    }

    res.json({ message: 'Chat muted successfully' });
  } catch (error) {
    console.error('Error muting chat:', error);
    res.status(500).json({ message: 'Error muting chat' });
  }
});

// Unmute a chat (direct message)
router.post('/unmute/chat/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    currentUser.mutedChats = currentUser.mutedChats.filter(
      id => id.toString() !== req.params.userId
    );
    await currentUser.save();

    res.json({ message: 'Chat unmuted successfully' });
  } catch (error) {
    console.error('Error unmuting chat:', error);
    res.status(500).json({ message: 'Error unmuting chat' });
  }
});

// Mute a group
router.post('/mute/group/:groupId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.mutedGroups.includes(req.params.groupId)) {
      currentUser.mutedGroups.push(req.params.groupId);
      await currentUser.save();
    }

    res.json({ message: 'Group muted successfully' });
  } catch (error) {
    console.error('Error muting group:', error);
    res.status(500).json({ message: 'Error muting group' });
  }
});

// Unmute a group
router.post('/unmute/group/:groupId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    currentUser.mutedGroups = currentUser.mutedGroups.filter(
      id => id.toString() !== req.params.groupId
    );
    await currentUser.save();

    res.json({ message: 'Group unmuted successfully' });
  } catch (error) {
    console.error('Error unmuting group:', error);
    res.status(500).json({ message: 'Error unmuting group' });
  }
});

// Archive a chat (direct message)
router.post('/archive/chat/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.archivedChats.includes(req.params.userId)) {
      currentUser.archivedChats.push(req.params.userId);
      await currentUser.save();
    }

    res.json({ message: 'Chat archived successfully' });
  } catch (error) {
    console.error('Error archiving chat:', error);
    res.status(500).json({ message: 'Error archiving chat' });
  }
});

// Unarchive a chat (direct message)
router.post('/unarchive/chat/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    currentUser.archivedChats = currentUser.archivedChats.filter(
      id => id.toString() !== req.params.userId
    );
    await currentUser.save();

    res.json({ message: 'Chat unarchived successfully' });
  } catch (error) {
    console.error('Error unarchiving chat:', error);
    res.status(500).json({ message: 'Error unarchiving chat' });
  }
});

// Archive a group
router.post('/archive/group/:groupId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.archivedGroups.includes(req.params.groupId)) {
      currentUser.archivedGroups.push(req.params.groupId);
      await currentUser.save();
    }

    res.json({ message: 'Group archived successfully' });
  } catch (error) {
    console.error('Error archiving group:', error);
    res.status(500).json({ message: 'Error archiving group' });
  }
});

// Unarchive a group
router.post('/unarchive/group/:groupId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    currentUser.archivedGroups = currentUser.archivedGroups.filter(
      id => id.toString() !== req.params.groupId
    );
    await currentUser.save();

    res.json({ message: 'Group unarchived successfully' });
  } catch (error) {
    console.error('Error unarchiving group:', error);
    res.status(500).json({ message: 'Error unarchiving group' });
  }
});

// Get user relationships (blocked, muted, archived)
router.get('/relationships', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('blockedUsers', 'name username')
      .populate('mutedChats', 'name username')
      .populate('mutedGroups', 'name')
      .populate('archivedChats', 'name username')
      .populate('archivedGroups', 'name');

    res.json({
      blockedUsers: currentUser.blockedUsers,
      mutedChats: currentUser.mutedChats,
      mutedGroups: currentUser.mutedGroups,
      archivedChats: currentUser.archivedChats,
      archivedGroups: currentUser.archivedGroups
    });
  } catch (error) {
    console.error('Error getting relationships:', error);
    res.status(500).json({ message: 'Error getting relationships' });
  }
});

module.exports = router;