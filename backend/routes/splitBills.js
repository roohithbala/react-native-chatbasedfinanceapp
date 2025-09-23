const express = require('express');
const SplitBill = require('../models/SplitBill');
const auth = require('../middleware/auth');

const router = express.Router();

// Get split bills for user (both created by and participating in)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const { page = 1, limit = 20, groupId } = req.query;
    
    const query = {
      $or: [
        { createdBy: req.userId },
        { 'participants.userId': req.userId }
      ]
    };
    
    if (groupId) query.groupId = groupId;

    const splitBills = await SplitBill.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    const total = await SplitBill.countDocuments(query);

    res.json({
      splitBills,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get split bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new split bill
router.post('/', auth, async (req, res) => {
  try {
    const {
      description,
      totalAmount,
      groupId,
      participants,
      splitType,
      category,
      currency = 'INR',
      notes
    } = req.body;

    // Validation
    if (!description || !totalAmount || !participants || !participants.length) {
      return res.status(400).json({ 
        message: 'Description, total amount, and participants are required' 
      });
    }

    // If groupId is provided, validate group exists and user is a member
    if (groupId) {
      const Group = require('../models/Group');
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!group.members.some(m => m.userId.toString() === req.userId.toString() && m.isActive)) {
        return res.status(403).json({ message: 'You must be a member of the group to create split bills' });
      }
    } else {
      // For direct chat split bills, validate that all participants exist
      const User = require('../models/User');
      const participantIds = participants.map(p => p.userId);
      const users = await User.find({ _id: { $in: participantIds } });
      
      if (users.length !== participantIds.length) {
        return res.status(400).json({ message: 'One or more participants not found' });
      }

      // Ensure the creator is included in participants for direct chat
      if (!participantIds.includes(req.userId.toString())) {
        return res.status(400).json({ message: 'Creator must be a participant in direct chat split bills' });
      }
    }

    // Validate total amount matches sum of participant amounts
    const totalParticipantAmount = participants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalAmount - totalParticipantAmount) > 0.01) {
      return res.status(400).json({ 
        message: 'Sum of participant amounts must equal total amount' 
      });
    }

    // Create the split bill
    const splitBill = new SplitBill({
      description,
      totalAmount,
      groupId: groupId ? new (require('mongoose').Types.ObjectId)(groupId) : null,
      participants: participants.map(p => ({
        ...p,
        userId: new (require('mongoose').Types.ObjectId)(p.userId), // Convert string to ObjectId
        isPaid: p.userId === req.userId.toString() // Compare strings for isPaid logic
      })),
      splitType: splitType || 'equal',
      category: category || 'Other',
      currency,
      notes,
      createdBy: req.userId
    });

    await splitBill.save();
    
    // Populate the response
    await splitBill
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    res.status(201).json({
      message: 'Split bill created successfully',
      splitBill
    });
  } catch (error) {
    console.error('Create split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark participant payment as paid
router.patch('/:id/mark-paid', auth, async (req, res) => {
  try {
    const splitBill = await SplitBill.findById(req.params.id);
    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    const participant = splitBill.participants.find(
      p => p.userId.toString() === req.userId
    );

    if (!participant) {
      return res.status(404).json({ message: 'You are not a participant in this bill' });
    }

    participant.isPaid = true;
    participant.paidAt = new Date();

    // Check if all participants have paid
    const allPaid = splitBill.participants.every(p => p.isPaid);
    if (allPaid) {
      splitBill.isSettled = true;
      splitBill.settledAt = new Date();
    }

    await splitBill.save();
    await splitBill
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    res.json({
      message: 'Payment marked as paid',
      splitBill
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get split bill details
router.get('/:id', auth, async (req, res) => {
  try {
    const splitBill = await SplitBill.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    res.json(splitBill);
  } catch (error) {
    console.error('Get split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get split bills for a specific group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate group exists and user is a member
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(m => m.userId.toString() === req.userId.toString() && m.isActive)) {
      return res.status(403).json({ message: 'You must be a group member to view split bills' });
    }

    const query = { groupId };

    const splitBills = await SplitBill.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    const total = await SplitBill.countDocuments(query);

    res.json({
      splitBills,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get group split bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get split bills for a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Users can only view their own split bills
    if (userId !== req.userId.toString()) {
      return res.status(403).json({ message: 'You can only view your own split bills' });
    }

    const query = {
      $or: [
        { createdBy: req.userId },
        { 'participants.userId': req.userId }
      ]
    };

    const splitBills = await SplitBill.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    const total = await SplitBill.countDocuments(query);

    res.json({
      splitBills,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get user split bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
