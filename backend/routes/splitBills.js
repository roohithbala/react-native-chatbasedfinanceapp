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
    console.log('🔄 Split bill creation request received');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.userId);
    
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

    console.log('🔍 Extracted data:', { description, totalAmount, groupId, participantsCount: participants?.length, splitType, category, currency, notes });

    // Validation
    if (!description || !totalAmount || !participants || !participants.length) {
      console.log('❌ Validation failed: missing required fields');
      return res.status(400).json({ 
        message: 'Description, total amount, and participants are required' 
      });
    }

    console.log('✅ Basic validation passed');

    // If groupId is provided, validate group exists and user is a member
    if (groupId) {
      console.log('🏢 Validating group split bill...');
      const Group = require('../models/Group');
      const group = await Group.findById(groupId);
      if (!group) {
        console.log('❌ Group not found:', groupId);
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!group.members.some(m => m.userId.toString() === req.userId.toString() && m.isActive)) {
        console.log('❌ User not a member of group');
        return res.status(403).json({ message: 'You must be a member of the group to create split bills' });
      }
      console.log('✅ Group validation passed');
    } else {
      console.log('👥 Validating direct split bill...');
      // For direct chat split bills, validate that all participants exist
      const User = require('../models/User');
      const participantIds = participants.map(p => p.userId);
      console.log('👥 Participant IDs:', participantIds);
      
      const users = await User.find({ _id: { $in: participantIds } });
      console.log('👥 Found users:', users.length, 'expected:', participantIds.length);
      
      if (users.length !== participantIds.length) {
        console.log('❌ Some participants not found');
        return res.status(400).json({ message: 'One or more participants not found' });
      }

      // Ensure the creator is included in participants for direct chat
      if (!participantIds.includes(req.userId.toString())) {
        console.log('❌ Creator not included in participants');
        return res.status(400).json({ message: 'Creator must be a participant in direct chat split bills' });
      }
      console.log('✅ Direct validation passed');
    }

    // Validate total amount matches sum of participant amounts
    const totalParticipantAmount = participants.reduce((sum, p) => sum + p.amount, 0);
    console.log('💰 Total amount:', totalAmount, 'Participant sum:', totalParticipantAmount);
    
    if (Math.abs(totalAmount - totalParticipantAmount) > 0.01) {
      console.log('❌ Amount mismatch');
      return res.status(400).json({ 
        message: 'Sum of participant amounts must equal total amount' 
      });
    }

    console.log('✅ Amount validation passed');

    // Create the split bill
    console.log('🔍 Creating split bill document...');
    const splitBillData = {
      description,
      totalAmount,
      groupId: groupId ? new (require('mongoose').Types.ObjectId)(groupId) : null,
      participants: participants.map(p => {
        console.log('👤 Processing participant:', p);
        try {
          const userIdObj = new (require('mongoose').Types.ObjectId)(p.userId);
          console.log('✅ Converted userId to ObjectId:', userIdObj);
          return {
            ...p,
            userId: userIdObj,
            isPaid: p.userId === req.userId.toString()
          };
        } catch (error) {
          console.error('❌ Failed to convert userId to ObjectId:', p.userId, error);
          throw new Error(`Invalid userId format: ${p.userId}`);
        }
      }),
      splitType: splitType || 'equal',
      category: category || 'Other',
      currency,
      notes,
      createdBy: req.userId
    };

    console.log('📝 Final split bill data:', JSON.stringify(splitBillData, null, 2));
    const splitBill = new SplitBill(splitBillData);

    console.log('💾 Saving split bill...');
    let savedSplitBill;
    try {
      savedSplitBill = await splitBill.save();
      console.log('✅ Split bill saved successfully with ID:', savedSplitBill._id);
    } catch (saveError) {
      console.error('❌ Failed to save split bill:', saveError);
      throw saveError;
    }

    console.log('🔍 Populating response...');
    try {
      await splitBill
        .populate('createdBy', 'name avatar')
        .populate('participants.userId', 'name avatar');
      console.log('✅ Split bill populated successfully');
    } catch (populateError) {
      console.error('❌ Failed to populate split bill:', populateError);
      // Return the split bill without population if populate fails
      console.log('⚠️ Returning split bill without population');
    }

    res.status(201).json({
      message: 'Split bill created successfully',
      splitBill
    });
  } catch (error) {
    console.error('❌ Create split bill error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark participant payment as paid
router.patch('/:id/mark-paid', auth, async (req, res) => {
  try {
    const splitBill = await SplitBill.findById(req.params.id)
      .populate('participants.userId', 'name')
      .populate('createdBy', 'name');

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Use proper authorization check
    const { isAuthorizedForSplitBill } = require('../utils/paymentUtils');
    if (!isAuthorizedForSplitBill(splitBill, req.userId)) {
      return res.status(403).json({ message: 'Not authorized to modify this split bill' });
    }

    // Find the participant using proper ID comparison (handle both populated objects and ObjectId strings)
    const participant = splitBill.participants.find(p => {
      const participantUserId = typeof p.userId === 'object' && p.userId ? p.userId._id || p.userId : p.userId;
      const participantIdString = participantUserId ? participantUserId.toString() : '';
      return participantIdString === req.userId.toString();
    });

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this bill' });
    }

    if (participant.isPaid) {
      return res.status(400).json({ message: 'You have already marked this payment as paid' });
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
