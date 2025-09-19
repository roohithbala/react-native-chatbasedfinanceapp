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
    if (!description || !totalAmount || !groupId || !participants || !participants.length) {
      return res.status(400).json({ 
        message: 'Description, total amount, group ID, and participants are required' 
      });
    }

    // Validate total amount matches sum of participant amounts
    const totalParticipantAmount = participants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalAmount - totalParticipantAmount) > 0.01) { // Allow for small floating point differences
      return res.status(400).json({ 
        message: 'Sum of participant amounts must equal total amount' 
      });
    }

    const splitBill = new SplitBill({
      description,
      totalAmount,
      groupId,
      participants,
      splitType: splitType || 'equal',
      category: category || 'Other',
      currency,
      notes,
      createdBy: req.userId
    });

    await splitBill.save();
    await splitBill
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .execPopulate();

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
      .populate('participants.userId', 'name avatar')
      .execPopulate();

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

module.exports = router;
