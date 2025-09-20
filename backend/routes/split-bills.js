const express = require('express');
const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get split bills for user (both created by and participating in)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, groupId, status } = req.query;
    
    const query = {
      $or: [
        { createdBy: req.userId },
        { 'participants.userId': req.userId }
      ]
    };
    
    if (groupId) {
      query.groupId = groupId;
    } else if (groupId === null) {
      // Explicitly filter for direct chat split bills (no groupId)
      query.groupId = { $exists: false };
    }

    if (status === 'pending') {
      query['participants'] = {
        $elemMatch: {
          userId: req.userId,
          isPaid: false
        }
      };
    } else if (status === 'paid') {
      query['participants'] = {
        $elemMatch: {
          userId: req.userId,
          isPaid: true
        }
      };
    }

    const splitBills = await SplitBill.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .populate({
        path: 'groupId',
        select: 'name',
        options: { allowEmpty: true }
      });

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
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!group.members.some(m => m.userId.toString() === req.userId)) {
        return res.status(403).json({ message: 'You must be a group member to create a split bill' });
      }
    } else {
      // For direct chat split bills, validate that all participants exist
      const participantIds = participants.map(p => p.userId);
      const users = await User.find({ _id: { $in: participantIds } });
      
      if (users.length !== participantIds.length) {
        return res.status(400).json({ message: 'One or more participants not found' });
      }

      // Ensure the creator is included in participants for direct chat
      const creatorIdString = req.userId.toString();
      if (!participantIds.includes(creatorIdString)) {
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
      groupId,
      participants: participants.map(p => ({
        ...p,
        isPaid: p.userId === req.userId // Mark as paid if creator is participant
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
      .populate('participants.userId', 'name avatar')
      .populate({
        path: 'groupId',
        select: 'name',
        options: { allowEmpty: true }
      });

    res.status(201).json({
      message: 'Split bill created successfully',
      splitBill
    });
  } catch (error) {
    console.error('Create split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get split bill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const splitBill = await SplitBill.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .populate({
        path: 'groupId',
        select: 'name',
        options: { allowEmpty: true }
      });

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Check if user is involved in the split bill
    const isInvolved = splitBill.createdBy._id.toString() === req.userId ||
      splitBill.participants.some(p => p.userId._id.toString() === req.userId);

    if (!isInvolved) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ splitBill });
  } catch (error) {
    console.error('Get split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark payment as paid
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

    if (participant.isPaid) {
      return res.status(400).json({ message: 'Payment already marked as paid' });
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

    // Populate the response
    await splitBill
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .populate({
        path: 'groupId',
        select: 'name',
        options: { allowEmpty: true }
      });

    res.json({
      message: 'Payment marked as paid',
      splitBill
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group split bills
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Verify group membership
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(m => m.userId.toString() === req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const splitBills = await SplitBill.find({ groupId: req.params.groupId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar');

    const total = await SplitBill.countDocuments({ groupId: req.params.groupId });

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

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { groupId, period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const query = {
      $or: [
        { createdBy: req.userId },
        { 'participants.userId': req.userId }
      ],
      createdAt: { $gte: startDate }
    };

    if (groupId) {
      query.groupId = groupId;
    }

    const stats = await SplitBill.aggregate([
      { $match: query },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                count: { $sum: 1 },
                settled: {
                  $sum: { $cond: ['$isSettled', 1, 0] }
                },
                pending: {
                  $sum: { $cond: ['$isSettled', 0, 1] }
                }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                amount: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { amount: -1 } }
          ],
          byGroup: [
            {
              $group: {
                _id: '$groupId',
                amount: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: 'groups',
                localField: '_id',
                foreignField: '_id',
                as: 'groupDetails'
              }
            },
            {
              $project: {
                amount: 1,
                count: 1,
                groupName: { $arrayElemAt: ['$groupDetails.name', 0] }
              }
            }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
