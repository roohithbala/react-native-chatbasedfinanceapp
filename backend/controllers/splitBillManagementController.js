const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const splitBillUtils = require('../utils/splitBillUtils');

/**
 * Create a new split bill
 * @param {string} userId - Creator user ID
 * @param {Object} splitBillData - Split bill data
 * @returns {Object} - Created split bill
 */
const createSplitBill = async (userId, splitBillData) => {
  const {
    description,
    totalAmount,
    groupId,
    participants,
    splitType,
    category,
    currency = 'INR',
    notes
  } = splitBillData;

  // Basic validation
  const validation = splitBillUtils.validateSplitBillData(splitBillData);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  // Validate participants and amounts
  const amountValidation = splitBillUtils.validateParticipantAmounts(participants, totalAmount);
  if (!amountValidation.isValid) {
    throw new Error(amountValidation.message);
  }

  let isGroupSplitBill = false;
  let validatedGroup = null;

  // Validate group or direct split bill
  if (groupId !== undefined && groupId !== null && groupId !== 'undefined' && groupId !== 'null' && groupId !== '') {
    const groupValidation = await splitBillUtils.validateGroupSplitBill(groupId, participants, userId);
    if (!groupValidation.isValid) {
      throw new Error(groupValidation.message);
    }
    isGroupSplitBill = true;
    validatedGroup = groupValidation.group;
  } else {
    const directValidation = await splitBillUtils.validateDirectSplitBill(participants, userId);
    if (!directValidation.isValid) {
      throw new Error(directValidation.message);
    }
  }

  // Create the split bill
  let groupIdObject = null;
  if (isGroupSplitBill) {
    try {
      groupIdObject = new mongoose.Types.ObjectId(groupId);
    } catch (error) {
      throw new Error(`Invalid groupId: ${groupId}`);
    }
  }

  const splitBill = new SplitBill({
    description,
    totalAmount,
    groupId: groupIdObject,
    participants: participants.map(p => {
      try {
        const participantData = {
          userId: new mongoose.Types.ObjectId(p.userId),
          amount: p.amount,
          isPaid: p.userId.toString() === userId.toString() // Creator has paid their share
        };
        return participantData;
      } catch (error) {
        throw new Error(`Invalid participant userId: ${p.userId}`);
      }
    }),
    splitType: splitType || 'equal',
    category: category || 'Other',
    currency,
    notes,
    createdBy: userId
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

  return splitBill;
};

/**
 * Mark a payment as paid
 * @param {string} splitBillId - Split bill ID
 * @param {string} userId - User ID marking payment as paid
 * @returns {Object} - Updated split bill
 */
const markPaymentAsPaid = async (splitBillId, userId) => {
  const splitBill = await SplitBill.findById(splitBillId);

  if (!splitBill) {
    throw new Error('Split bill not found');
  }

  const participant = splitBill.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
    // Check if user is the creator - creators might not be in participants array for legacy data
    if (splitBill.createdBy.toString() === userId.toString()) {
      throw new Error('You have already paid as the bill creator, or this bill was created incorrectly');
    }
    throw new Error('You are not a participant in this bill');
  }

  if (participant.isPaid) {
    throw new Error('Payment already marked as paid');
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

  return splitBill;
};

/**
 * Reject a split bill
 * @param {string} splitBillId - Split bill ID
 * @param {string} userId - User ID rejecting the bill
 * @returns {Object} - Updated split bill
 */
const rejectSplitBill = async (splitBillId, userId) => {
  const splitBill = await SplitBill.findById(splitBillId);

  if (!splitBill) {
    throw new Error('Split bill not found');
  }

  // Check if user is a participant
  const participant = splitBill.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
    throw new Error('You are not a participant in this bill');
  }

  // Check if bill is already settled
  if (splitBill.isSettled) {
    throw new Error('Bill already settled');
  }

  // Check if user is trying to reject their own bill
  if (splitBill.createdBy.toString() === userId) {
    throw new Error('Cannot reject your own bill');
  }

  // Mark participant as rejected (we'll add a rejected field to the schema)
  participant.isRejected = true;
  participant.rejectedAt = new Date();

  // Check if all non-creator participants have rejected
  const activeParticipants = splitBill.participants.filter(p => p.userId.toString() !== splitBill.createdBy.toString());
  const allRejected = activeParticipants.every(p => p.isRejected);

  if (allRejected) {
    // If all participants reject, cancel the bill
    splitBill.isCancelled = true;
    splitBill.cancelledAt = new Date();
    splitBill.cancelReason = 'All participants rejected the bill';
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

  return splitBill;
};

module.exports = {
  createSplitBill,
  markPaymentAsPaid,
  rejectSplitBill
};