const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const groupController = require('../controllers/groupController');

const router = express.Router();

// Get user groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await groupController.getUserGroups(req.userId);
    res.json({
      status: 'success',
      data: { groups }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch groups'
    });
  }
});

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await groupController.createGroup({ name, description }, req.userId, req.io);

    res.status(201).json({
      status: 'success',
      data: {
        message: 'Group created successfully',
        group
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create group'
    });
  }
});

// Join group with invite code
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const group = await groupController.joinGroup(req.params.inviteCode, req.userId);

    res.json({
      status: 'success',
      data: {
        message: 'Successfully joined group',
        group
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    const statusCode = error.message.includes('already') ? 400 : 404;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get group details
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await groupController.getGroupDetails(req.params.id, req.userId);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email, username } = req.body;

    // Validate that either email or username is provided
    if ((!email && !username) || (email && username)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide either email or username (not both)'
      });
    }

    const searchField = email ? 'email' : 'username';
    const searchValue = (email || username).trim();

    const group = await groupController.addMemberToGroup(req.params.id, searchField, searchValue, req.userId, req.io);

    res.json({
      status: 'success',
      data: {
        message: 'Member added successfully',
        group
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Split bill
router.post('/:id/split', auth, async (req, res) => {
  try {
    const splitBill = await groupController.splitBill(req.params.id, req.body, req.userId);

    res.status(201).json({
      status: 'success',
      data: {
        message: 'Bill split successfully',
        splitBill
      }
    });
  } catch (error) {
    console.error('Split bill error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Generate new invite code
router.post('/:id/invite-code', auth, async (req, res) => {
  try {
    const result = await groupController.generateNewInviteCode(req.params.id, req.userId);

    res.json({
      status: 'success',
      data: {
        message: 'New invite code generated',
        inviteCode: result.newInviteCode
      }
    });
  } catch (error) {
    console.error('Generate invite code error:', error);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

// Make member admin
router.put('/:id/members/:memberId/role', auth, async (req, res) => {
  try {
    const { role } = req.body;
    const group = await groupController.updateMemberRole(req.params.id, req.params.memberId, role, req.userId, req.io);

    res.json({
      status: 'success',
      data: {
        message: `Member role updated to ${role}`,
        group
      }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Remove member from group
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const group = await groupController.removeMemberFromGroup(req.params.id, req.params.memberId, req.userId, req.io);

    res.json({
      status: 'success',
      data: {
        message: 'Member removed from group',
        group
      }
    });
  } catch (error) {
    console.error('Remove member error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Leave group
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    await groupController.leaveGroup(req.params.id, req.userId, req.io);

    res.json({
      status: 'success',
      data: {
        message: 'Successfully left the group'
      }
    });
  } catch (error) {
    console.error('Leave group error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update group basic information
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate group ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid group ID'
      });
    }

    const group = await groupController.updateGroupInfo(req.params.id, req.body, req.userId);

    res.json({
      status: 'success',
      data: {
        message: 'Group information updated',
        group
      }
    });
  } catch (error) {
    console.error('Update group info error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update group settings
router.put('/:id/settings', auth, async (req, res) => {
  try {
    // Validate group ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid group ID'
      });
    }

    const settings = await groupController.updateGroupSettings(req.params.id, req.body.settings || {}, req.userId);

    res.json({
      status: 'success',
      data: {
        message: 'Group settings updated',
        settings
      }
    });
  } catch (error) {
    console.error('Update group settings error:', error);
    const statusCode = error.message.includes('Invalid') ? 400 : 404;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update notification settings
router.put('/:id/notifications', auth, async (req, res) => {
  try {
    // Validate group ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid group ID'
      });
    }

    const notifications = await groupController.updateNotificationSettings(req.params.id, req.body.notifications || {}, req.userId);

    res.json({
      status: 'success',
      data: {
        message: 'Notification settings updated',
        notifications
      }
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get group stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const period = req.query.period || 'month'; // Default to month
    const stats = await groupController.getGroupStats(req.params.id, req.userId, period);

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;