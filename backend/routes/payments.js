const express = require('express');
const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const auth = require('../middleware/auth');

const router = express.Router();

// Mark participant as paid
router.post('/:splitBillId/participants/:participantId/pay', auth, async (req, res) => {
  try {
    const { splitBillId, participantId } = req.params;
    const { paymentMethod, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(splitBillId) || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const splitBill = await SplitBill.findById(splitBillId)
      .populate('participants.userId', 'name')
      .populate('createdBy', 'name');

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Check if user is authorized (creator or participant)
    const isCreator = splitBill.createdBy.toString() === req.userId;
    const isParticipant = splitBill.participants.some(p => p.userId.toString() === req.userId);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to modify this split bill' });
    }

    // Mark participant as paid
    await splitBill.markParticipantAsPaid(participantId, paymentMethod, notes);

    // Emit real-time update to group members
    if (req.io && splitBill.groupId) {
      req.io.to(splitBill.groupId.toString()).emit('split-bill-updated', {
        type: 'payment-made',
        splitBillId: splitBill._id,
        participantId: participantId,
        paymentMethod: paymentMethod,
        updatedBy: req.userId,
        splitBill: {
          _id: splitBill._id,
          description: splitBill.description,
          totalAmount: splitBill.totalAmount,
          isSettled: splitBill.isSettled,
          participants: splitBill.participants,
          payments: splitBill.payments
        }
      });
    }

    res.json({
      message: 'Payment recorded successfully',
      splitBill: {
        _id: splitBill._id,
        description: splitBill.description,
        totalAmount: splitBill.totalAmount,
        isSettled: splitBill.isSettled,
        participants: splitBill.participants,
        payments: splitBill.payments
      }
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Confirm payment
router.post('/:splitBillId/payments/:paymentId/confirm', auth, async (req, res) => {
  try {
    const { splitBillId, paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(splitBillId) || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const splitBill = await SplitBill.findById(splitBillId);

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Check if user is authorized
    const isCreator = splitBill.createdBy.toString() === req.userId;
    const isParticipant = splitBill.participants.some(p => p.userId.toString() === req.userId);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to confirm payments for this split bill' });
    }

    await splitBill.confirmPayment(paymentId, req.userId);

    res.json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get payment summary for a split bill
router.get('/:splitBillId/summary', auth, async (req, res) => {
  try {
    const { splitBillId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(splitBillId)) {
      return res.status(400).json({ message: 'Invalid split bill ID' });
    }

    const splitBill = await SplitBill.findById(splitBillId)
      .populate('participants.userId', 'name avatar')
      .populate('createdBy', 'name avatar')
      .populate('payments.fromUserId', 'name')
      .populate('payments.toUserId', 'name')
      .populate('payments.confirmedBy.userId', 'name');

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Check if user is authorized
    const isCreator = splitBill.createdBy.toString() === req.userId;
    const isParticipant = splitBill.participants.some(p => p.userId.toString() === req.userId);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this split bill' });
    }

    const summary = splitBill.getPaymentSummary();
    const debts = splitBill.getDebts();

    res.json({
      splitBill: {
        _id: splitBill._id,
        description: splitBill.description,
        totalAmount: splitBill.totalAmount,
        createdBy: splitBill.createdBy,
        participants: splitBill.participants,
        payments: splitBill.payments,
        isSettled: splitBill.isSettled,
        createdAt: splitBill.createdAt
      },
      summary,
      debts
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group settlement plan
router.get('/groups/:groupId/settlement', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    // Check if user is member of the group
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(member =>
      member.userId.toString() === req.userId.toString() && member.isActive
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view group settlement' });
    }

    const settlement = await SplitBill.calculateGroupSettlement(groupId);

    res.json({
      settlement,
      group: {
        _id: group._id,
        name: group.name
      }
    });
  } catch (error) {
    console.error('Get group settlement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add payment reminder
router.post('/:splitBillId/reminders', auth, async (req, res) => {
  try {
    const { splitBillId } = req.params;
    const { userId, type, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(splitBillId)) {
      return res.status(400).json({ message: 'Invalid split bill ID' });
    }

    const splitBill = await SplitBill.findById(splitBillId);

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Only creator can send reminders
    if (splitBill.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the bill creator can send reminders' });
    }

    await splitBill.addReminder(userId, type, message);

    res.json({ message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('Add reminder error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get user's payment history
router.get('/users/:userId/history', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Users can only view their own payment history
    if (userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this payment history' });
    }

    const payments = await SplitBill.aggregate([
      {
        $match: {
          $or: [
            { createdBy: mongoose.Types.ObjectId(userId) },
            { 'participants.userId': mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'group'
        }
      },
      {
        $project: {
          description: 1,
          totalAmount: 1,
          createdAt: 1,
          isSettled: 1,
          category: 1,
          payments: {
            $filter: {
              input: '$payments',
              as: 'payment',
              cond: {
                $or: [
                  { $eq: ['$$payment.fromUserId', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$$payment.toUserId', mongoose.Types.ObjectId(userId)] }
                ]
              }
            }
          },
          participants: {
            $filter: {
              input: '$participants',
              as: 'participant',
              cond: { $eq: ['$$participant.userId', mongoose.Types.ObjectId(userId)] }
            }
          },
          creator: { $arrayElemAt: ['$creator', 0] },
          group: { $arrayElemAt: ['$group', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await SplitBill.countDocuments({
      $or: [
        { createdBy: mongoose.Types.ObjectId(userId) },
        { 'participants.userId': mongoose.Types.ObjectId(userId) }
      ]
    });

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;