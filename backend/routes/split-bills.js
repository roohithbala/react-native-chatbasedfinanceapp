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

    console.log('Creating split bill with data:', {
      description,
      totalAmount,
      groupId,
      participantsCount: participants?.length,
      splitType,
      category,
      currency
    });

    // Validation
    if (!description || !totalAmount || !participants || !participants.length) {
      return res.status(400).json({
        message: 'Description, total amount, and participants are required'
      });
    }

    // Validate total amount is a positive number
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({
        message: 'Total amount must be a positive number'
      });
    }

    // If groupId is provided, validate group exists and user is a member
    let isGroupSplitBill = false;
    if (groupId && groupId !== 'undefined' && groupId !== 'null' && groupId !== '') {
      console.log('Validating group split bill for groupId:', groupId);
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const isMember = group.members.some(m => m.userId.toString() === req.userId.toString() && m.isActive);
      if (!isMember) {
        return res.status(403).json({ message: 'You must be a member of the group to create split bills' });
      }

      // For group split bills, validate that all participants are group members
      const groupMemberIds = group.members
        .filter(m => m.isActive)
        .map(m => m.userId.toString());

      const invalidParticipants = participants.filter(p => !groupMemberIds.includes(p.userId));
      if (invalidParticipants.length > 0) {
        return res.status(400).json({
          message: 'All participants must be active members of the group'
        });
      }

      isGroupSplitBill = true;
      console.log('Group split bill validation passed');
    } else {
      console.log('Creating direct chat split bill');
      // For direct chat split bills, validate that all participants exist and are not the same user
      const participantIds = participants.map(p => p.userId);

      // Remove duplicates
      const uniqueParticipantIds = [...new Set(participantIds)];

      if (uniqueParticipantIds.length !== participantIds.length) {
        return res.status(400).json({ message: 'Duplicate participants are not allowed' });
      }

      // Check that creator is not trying to split with themselves only
      const otherParticipants = uniqueParticipantIds.filter(id => id !== req.userId.toString());
      if (otherParticipants.length === 0) {
        return res.status(400).json({ message: 'Cannot create split bill with only yourself' });
      }

      const users = await User.find({ _id: { $in: uniqueParticipantIds } });

      if (users.length !== uniqueParticipantIds.length) {
        return res.status(400).json({ message: 'One or more participants not found' });
      }

      console.log('Direct chat split bill validation passed');
    }

    // Validate participant amounts
    const totalParticipantAmount = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (Math.abs(totalAmount - totalParticipantAmount) > 0.01) {
      console.log('Amount mismatch:', { totalAmount, totalParticipantAmount });
      return res.status(400).json({
        message: 'Sum of participant amounts must equal total amount'
      });
    }

    // Ensure all participants have valid amounts
    const invalidAmounts = participants.filter(p => !p.amount || p.amount <= 0);
    if (invalidAmounts.length > 0) {
      return res.status(400).json({
        message: 'All participants must have valid positive amounts'
      });
    }

    console.log('Creating split bill in database...');

    // Create the split bill
    const splitBill = new SplitBill({
      description,
      totalAmount,
      groupId: isGroupSplitBill ? new mongoose.Types.ObjectId(groupId) : null,
      participants: participants.map(p => ({
        userId: new mongoose.Types.ObjectId(p.userId),
        amount: p.amount,
        isPaid: p.userId === req.userId.toString() // Creator has paid their share
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

    console.log('Split bill created successfully:', splitBill._id);

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

    if (!group.members.some(m => m.userId.toString() === req.userId && m.isActive)) {
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
