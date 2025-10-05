const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const splitBillUtils = require('../utils/splitBillUtils');
const reminderService = require('../utils/reminderService');

/**
 * Create a new split bill
 * @param {string} userId - Creator user ID
 * @param {Object} splitBillData - Split bill data
 * @returns {Object} - Created split bill
 */
const createSplitBill = async (userId, splitBillData) => {
  console.log('🔄 Starting createSplitBill with userId:', userId);
  
  // Validate userId
  if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
    throw new Error('Invalid userId provided');
  }
  
  try {
    new mongoose.Types.ObjectId(userId);
  } catch (error) {
    throw new Error('Invalid userId format');
  }
  
  console.log('📋 Split bill data:', JSON.stringify(splitBillData, null, 2));
  
  const {
    description,
    totalAmount,
    groupId,
    participants,
    splitType,
    category,
    currency = 'INR',
    notes,
    reminderSettings
  } = splitBillData;

  console.log('🔍 Extracted data:', { description, totalAmount, groupId, participantsCount: participants?.length });

  // Basic validation
  console.log('✅ Starting basic validation...');
  const validation = splitBillUtils.validateSplitBillData(splitBillData);
  if (!validation.isValid) {
    console.log('❌ Basic validation failed:', validation.message);
    throw new Error(validation.message);
  }
  console.log('✅ Basic validation passed');

  // Validate participants and amounts
  console.log('✅ Starting amount validation...');
  const amountValidation = splitBillUtils.validateParticipantAmounts(participants, totalAmount);
  if (!amountValidation.isValid) {
    console.log('❌ Amount validation failed:', amountValidation.message);
    throw new Error(amountValidation.message);
  }
  console.log('✅ Amount validation passed');

  let isGroupSplitBill = false;
  let validatedGroup = null;

  // Validate group or direct split bill
  console.log('🔍 Checking if group split bill...');
  console.log('GroupId value:', groupId, 'type:', typeof groupId);
  
  // Handle various invalid groupId values
  const isValidGroupId = groupId !== undefined && 
                        groupId !== null && 
                        groupId !== 'undefined' && 
                        groupId !== 'null' && 
                        groupId !== '' &&
                        groupId !== 'false' &&
                        typeof groupId === 'string' && 
                        groupId.length > 0;
                        
  if (isValidGroupId) {
    console.log('📋 Validating group split bill for groupId:', groupId);
    const groupValidation = await splitBillUtils.validateGroupSplitBill(groupId, participants, userId);
    if (!groupValidation.isValid) {
      console.log('❌ Group validation failed:', groupValidation.message);
      throw new Error(groupValidation.message);
    }
    isGroupSplitBill = true;
    validatedGroup = groupValidation.group;
    console.log('✅ Group validation passed');
  } else {
    console.log('📋 Validating direct split bill (no valid groupId)');
    const directValidation = await splitBillUtils.validateDirectSplitBill(participants, userId);
    if (!directValidation.isValid) {
      console.log('❌ Direct validation failed:', directValidation.message);
      throw new Error(directValidation.message);
    }
    console.log('✅ Direct validation passed');
  }

  // Create the split bill
  console.log('🔄 Creating split bill object...');
  let groupIdObject = null;
  if (isGroupSplitBill) {
    try {
      groupIdObject = new mongoose.Types.ObjectId(groupId);
      console.log('✅ GroupId converted to ObjectId:', groupIdObject);
    } catch (error) {
      console.log('❌ Invalid groupId format:', groupId, 'error:', error.message);
      throw new Error(`Invalid groupId format: ${groupId}`);
    }
  }

  console.log('🔄 Creating participants array...');
  const splitBillParticipants = participants.map(p => {
    console.log('Processing participant:', p);
    try {
      // Validate participant data
      if (!p || typeof p !== 'object') {
        throw new Error('Invalid participant object');
      }
      
      // Handle userId - could be string or object with _id
      let userIdStr = p.userId;
      if (typeof p.userId === 'object' && p.userId._id) {
        userIdStr = p.userId._id;
      }
      if (typeof userIdStr !== 'string' || userIdStr.trim() === '') {
        throw new Error('Invalid participant userId');
      }
      
      if (!p.amount || typeof p.amount !== 'number' || p.amount <= 0) {
        throw new Error('Invalid participant amount');
      }
      
      const participantData = {
        userId: new mongoose.Types.ObjectId(userIdStr.trim()),
        amount: p.amount,
        isPaid: false // Participants start as unpaid
      };
      console.log('✅ Created participant:', { userId: participantData.userId, amount: participantData.amount, isPaid: participantData.isPaid });
      return participantData;
    } catch (error) {
      console.log('❌ Invalid participant data:', p, 'error:', error.message);
      throw new Error(`Invalid participant data: ${error.message}`);
    }
  });

  console.log('🔄 Creating SplitBill instance...');
  const splitBill = new SplitBill({
    description,
    totalAmount,
    groupId: groupIdObject,
    participants: splitBillParticipants,
    splitType: splitType || 'equal',
    category: category || 'Other',
    currency,
    notes,
    createdBy: new mongoose.Types.ObjectId(userId)
  });

  console.log('💾 Saving split bill to database...');
  await splitBill.save();
  console.log('✅ Split bill saved successfully, ID:', splitBill._id);

  // Schedule reminders if settings provided
  if (reminderSettings) {
    console.log('🔄 Scheduling reminders...');
    try {
      await reminderService.scheduleReminders(splitBill._id, reminderSettings);
      console.log('✅ Reminders scheduled successfully');
    } catch (reminderError) {
      console.log('⚠️ Failed to schedule reminders, but continuing:', reminderError.message);
      // Don't fail the entire operation if reminder scheduling fails
    }
  }

  // Populate the response
  console.log('🔄 Populating response data...');
  try {
    await splitBill
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .populate({
        path: 'groupId',
        select: 'name',
        options: { allowEmpty: true }
      });
    console.log('✅ Population completed successfully');
  } catch (populateError) {
    console.log('⚠️ Population failed, but continuing:', populateError.message);
    // Don't fail the entire operation if population fails
  }

  console.log('✅ Split bill creation completed successfully');
  return splitBill;
};

/**
 * Mark a payment as paid
 * @param {string} splitBillId - Split bill ID
 * @param {string} userId - User ID marking payment as paid
 * @param {Object} io - Socket.io instance for real-time updates
 * @returns {Object} - Updated split bill
 */
const markPaymentAsPaid = async (splitBillId, userId, io) => {
  const splitBill = await SplitBill.findById(splitBillId);

  if (!splitBill) {
    throw new Error('Split bill not found');
  }

  const participant = splitBill.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
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

  // Emit real-time update via socket
  if (io) {
    try {
      // Transform split bill data for frontend
      const splitBillData = {
        splitBillId: splitBill._id.toString(),
        description: splitBill.description,
        totalAmount: splitBill.totalAmount,
        userShare: participant.amount, // The current user's share
        isPaid: participant.isPaid,
        participants: splitBill.participants.map(p => ({
          userId: p.userId._id ? p.userId._id.toString() : p.userId.toString(),
          name: p.userId.name || 'Unknown',
          amount: p.amount,
          isPaid: p.isPaid
        }))
      };

      // Emit to group room if it's a group split bill
      if (splitBill.groupId) {
        io.to(splitBill.groupId.toString()).emit('splitBillUpdate', {
          type: 'payment-made',
          splitBillId: splitBill._id,
          splitBill: splitBillData,
          userId: userId,
          timestamp: new Date()
        });
        console.log(`✅ Emitted split bill payment update to group ${splitBill.groupId}`);
      } else {
        // For direct split bills, emit to all participants
        splitBill.participants.forEach(participant => {
          io.to(`user_${participant.userId}`).emit('splitBillUpdate', {
            type: 'payment-made',
            splitBillId: splitBill._id,
            splitBill: splitBillData,
            userId: userId,
            timestamp: new Date()
          });
        });
        // Also emit to creator
        io.to(`user_${splitBill.createdBy}`).emit('splitBillUpdate', {
          type: 'payment-made',
          splitBillId: splitBill._id,
          splitBill: splitBillData,
          userId: userId,
          timestamp: new Date()
        });
        console.log(`✅ Emitted split bill payment update to ${splitBill.participants.length + 1} users`);
      }
    } catch (socketError) {
      console.error('⚠️ Failed to emit socket event for payment:', socketError);
      // Don't fail the payment operation if socket emission fails
    }
  }

  return splitBill;
};

/**
 * Reject a split bill
 * @param {string} splitBillId - Split bill ID
 * @param {string} userId - User ID rejecting the bill
 * @param {Object} io - Socket.io instance for real-time updates
 * @returns {Object} - Updated split bill
 */
const rejectSplitBill = async (splitBillId, userId, io) => {
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

  // Check if all participants have rejected
  const allRejected = splitBill.participants.every(p => p.isRejected);

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

  // Emit real-time update via socket
  if (io) {
    try {
      // Transform split bill data for frontend
      const splitBillData = {
        splitBillId: splitBill._id.toString(),
        description: splitBill.description,
        totalAmount: splitBill.totalAmount,
        userShare: participant.amount, // The current user's share
        isPaid: participant.isPaid,
        participants: splitBill.participants.map(p => ({
          userId: p.userId._id ? p.userId._id.toString() : p.userId.toString(),
          name: p.userId.name || 'Unknown',
          amount: p.amount,
          isPaid: p.isPaid
        }))
      };

      // Emit to group room if it's a group split bill
      if (splitBill.groupId) {
        io.to(splitBill.groupId.toString()).emit('splitBillUpdate', {
          type: 'bill-rejected',
          splitBillId: splitBill._id,
          splitBill: splitBillData,
          userId: userId,
          timestamp: new Date()
        });
        console.log(`✅ Emitted split bill rejection update to group ${splitBill.groupId}`);
      } else {
        // For direct split bills, emit to all participants
        splitBill.participants.forEach(participant => {
          io.to(`user_${participant.userId}`).emit('splitBillUpdate', {
            type: 'bill-rejected',
            splitBillId: splitBill._id,
            splitBill: splitBillData,
            userId: userId,
            timestamp: new Date()
          });
        });
        // Also emit to creator
        io.to(`user_${splitBill.createdBy}`).emit('splitBillUpdate', {
          type: 'bill-rejected',
          splitBillId: splitBill._id,
          splitBill: splitBillData,
          userId: userId,
          timestamp: new Date()
        });
        console.log(`✅ Emitted split bill rejection update to ${splitBill.participants.length + 1} users`);
      }
    } catch (socketError) {
      console.error('⚠️ Failed to emit socket event for rejection:', socketError);
      // Don't fail the rejection operation if socket emission fails
    }
  }

  return splitBill;
};

module.exports = {
  createSplitBill,
  markPaymentAsPaid,
  rejectSplitBill
};