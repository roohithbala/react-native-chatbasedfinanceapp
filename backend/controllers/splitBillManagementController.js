const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const splitBillUtils = require('../utils/splitBillUtils');
const reminderService = require('../utils/reminderService');
const emailService = require('../utils/emailService');
const User = require('../models/User');

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
  console.log('GroupId from splitBillData:', splitBillData.groupId);
  
  // Handle various invalid groupId values
  const isValidGroupId = groupId !== undefined && 
                        groupId !== null && 
                        groupId !== 'undefined' && 
                        groupId !== 'null' && 
                        groupId !== '' &&
                        groupId !== 'false' &&
                        typeof groupId === 'string' && 
                        groupId.length > 0;
  
  console.log('🔍 isValidGroupId:', isValidGroupId);
                        
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
  const splitBillParticipants = participants
    .map(p => {
      console.log('Processing participant:', p);
      try {
        // Validate participant data
        if (!p || typeof p !== 'object') {
          throw new Error('Invalid participant object');
        }
        
        // Handle userId - could be string, ObjectId, or object with _id
        let userIdValue = p.userId;
        
        // Simplify: Convert everything to string first
        let userIdStr = '';
        
        if (!userIdValue) {
          throw new Error('Missing userId in participant data');
        }
        
        // Convert to string based on type
        if (typeof userIdValue === 'string') {
          userIdStr = userIdValue;
        } else if (userIdValue instanceof mongoose.Types.ObjectId) {
          userIdStr = userIdValue.toString();
        } else if (typeof userIdValue === 'object' && userIdValue._id) {
          // Populated user object
          userIdStr = userIdValue._id.toString();
        } else if (typeof userIdValue.toString === 'function') {
          userIdStr = userIdValue.toString();
        } else {
          console.log('❌ Cannot extract userId from:', userIdValue, 'type:', typeof userIdValue);
          throw new Error('Invalid participant userId format');
        }
        
        // Validate the string
        userIdStr = userIdStr.trim();
        if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
          console.log('❌ Invalid userId string:', { original: p.userId, extracted: userIdStr });
          throw new Error('Invalid participant userId');
        }
        
        console.log('✅ Validated userId:', userIdStr);
        
        if (!p.amount || typeof p.amount !== 'number' || p.amount <= 0) {
          throw new Error('Invalid participant amount');
        }
        
        // Check if this participant is the creator
        const isCreator = userIdStr === userId.toString();
        
        // Create ObjectId from validated string
        const participantData = {
          userId: new mongoose.Types.ObjectId(userIdStr),
          amount: p.amount,
          isPaid: isCreator ? true : false, // Creator is marked as paid, others as unpaid
          paidAt: isCreator ? new Date() : undefined
        };
        
        console.log('✅ Created participant:', { 
          userId: participantData.userId.toString(), 
          amount: participantData.amount, 
          isPaid: participantData.isPaid,
          isCreator 
        });
        
        return participantData;
      } catch (error) {
        console.log('❌ Invalid participant data:', p, 'error:', error.message);
        throw new Error(`Invalid participant data: ${error.message}`);
      }
    });

  console.log('🔄 Creating SplitBill instance...');
  console.log('Split bill data:', {
    description,
    totalAmount,
    groupId: groupIdObject?.toString(),
    participantCount: splitBillParticipants.length,
    splitType: splitType || 'equal',
    category: category || 'Other',
    currency,
    createdBy: userId
  });
  
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
  console.log('✅ Split bill saved successfully:', {
    _id: splitBill._id.toString(),
    groupId: splitBill.groupId?.toString(),
    participantCount: splitBill.participants.length
  });

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

  // Schedule email escalation for unpaid participants (24 hours delay)
  console.log('🔄 Scheduling email escalation...');
  try {
    // Get creator user info for emails
    const creatorUser = await User.findById(userId).select('name email');

    // Send immediate notification to participants about the new split bill (fire-and-forget)
    try {
      const notifyPromises = splitBill.participants.map(async (participant) => {
        try {
          // Don't notify the creator
          if (participant.userId.toString() === userId.toString()) return;
          await emailService.sendSplitBillCreatedEmail(participant.userId, splitBill, creatorUser || { _id: userId, name: 'User' });
        } catch (e) {
          console.error('Failed to send split bill created email to participant:', participant.userId, e.message || e);
        }
      });
      Promise.allSettled(notifyPromises).then(() => {});
    } catch (notifyErr) {
      console.error('Error while sending split bill created notifications:', notifyErr);
    }

    // Schedule escalation emails for each participant after 24 hours
    const escalationPromises = splitBillParticipants.map(async (participant) => {
      // Only schedule for participants who haven't paid yet
      if (!participant.isPaid) {
        setTimeout(async () => {
          try {
            // Check if the bill is still unpaid
            const currentBill = await SplitBill.findById(splitBill._id);
            if (currentBill && !currentBill.isSettled) {
              // Find the participant in the current bill
              const currentParticipant = currentBill.participants.find(
                p => p.userId.toString() === participant.userId.toString()
              );

              // Only send if still unpaid and not rejected
              if (currentParticipant && !currentParticipant.isPaid && !currentParticipant.isRejected) {
                await emailService.sendSplitBillEscalationEmail(
                  participant.userId,
                  currentBill,
                  creatorUser || { _id: userId, name: 'User' }
                );
                console.log(`📧 Escalation email sent to participant ${participant.userId}`);
              }
            }
          } catch (emailError) {
            console.error('⚠️ Failed to send escalation email:', emailError);
          }
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
      }
    });

    // Don't await these - let them run in background
    Promise.all(escalationPromises).catch(error => {
      console.error('⚠️ Error in escalation scheduling:', error);
    });

    console.log('✅ Email escalation scheduled successfully');
  } catch (escalationError) {
    console.log('⚠️ Failed to schedule email escalation, but continuing:', escalationError.message);
    // Don't fail the entire operation if escalation scheduling fails
  }

  // Populate the response
  console.log('🔄 Populating response data...');
  try {
    await splitBill.populate('createdBy', 'name avatar username');
    await splitBill.populate('participants.userId', 'name avatar username');
    await splitBill.populate({
      path: 'groupId',
      select: 'name',
      options: { allowEmpty: true }
    });
    console.log('✅ Population completed successfully');
  } catch (populateError) {
    console.log('⚠️ Population failed, but continuing:', populateError.message);
    // Don't fail the entire operation if population fails
  }

  // Create a message in the group chat if it's a group split bill
  if (isGroupSplitBill && groupIdObject) {
    console.log('💬 Creating split bill message in group chat...');
    try {
      const Message = require('../models/Message');
      const User = require('../models/User');
      
      // Get creator user details
      const creator = await User.findById(userId).select('name avatar username');
      
      // Use the populated split bill participants
      const populatedParticipants = splitBill.participants || splitBillParticipants;
      
      // Find current user's share from populated participants
      const userParticipant = populatedParticipants.find(p => {
        const participantId = p.userId._id ? p.userId._id.toString() : p.userId.toString();
        return participantId === userId.toString();
      });
      const userShare = userParticipant ? userParticipant.amount : 0;
      
      // Create message with split bill data
      const message = new Message({
        text: `💰 Split Bill Created: ${description}\nTotal: ₹${totalAmount}\nParticipants: ${populatedParticipants.length}`,
        user: {
          _id: userId,
          name: creator?.name || 'User',
          username: creator?.username || 'user',
          avatar: creator?.avatar || ''
        },
        groupId: groupIdObject,
        type: 'split_bill',
        status: 'sent',
        splitBillData: {
          _id: splitBill._id.toString(),
          splitBillId: splitBill._id,
          description: splitBill.description,
          totalAmount: splitBill.totalAmount,
          userShare: userShare,
          isPaid: userParticipant ? userParticipant.isPaid : false,
          createdBy: {
            _id: creator._id.toString(),
            name: creator.name,
            username: creator.username,
            avatar: creator.avatar
          },
          participants: populatedParticipants.map(p => {
            const pUserId = p.userId._id || p.userId;
            const pUserName = p.userId.name || p.userId.username || 'Unknown';
            return {
              userId: pUserId.toString(),
              name: pUserName,
              amount: p.amount,
              isPaid: p.isPaid,
              isRejected: p.isRejected || false
            };
          })
        },
        readBy: [{
          userId: userId,
          readAt: new Date()
        }]
      });
      
      await message.save();
      console.log('✅ Split bill message created:', message._id);
      
      // Emit socket event for real-time update
      const io = require('../server').io;
      if (io) {
        const chatUtils = require('../utils/chatUtils');
        const formattedMessage = chatUtils.formatMessageForSocket(message);
        io.to(groupIdObject.toString()).emit('receiveMessage', formattedMessage);
        console.log('✅ Socket event emitted for new split bill message');
      }
    } catch (messageError) {
      console.error('⚠️ Failed to create split bill message:', messageError);
      // Don't fail the entire operation if message creation fails
    }
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

  // If already paid, don't throw error - just ensure data is correct and emit socket event
  if (participant.isPaid) {
    console.log('ℹ️ Payment already marked as paid, but continuing to return current state');
  } else {
    participant.isPaid = true;
    participant.paidAt = new Date();

    // Check if all participants have paid
    const allPaid = splitBill.participants.every(p => p.isPaid);
    if (allPaid) {
      splitBill.isSettled = true;
      splitBill.settledAt = new Date();
    }
  }

  await splitBill.save();

  // Re-fetch the split bill to ensure we have a fresh document for population
  const updatedSplitBill = await SplitBill.findById(splitBillId);

  if (!updatedSplitBill) {
    throw new Error('Failed to retrieve updated split bill');
  }

  // Populate the response
  await updatedSplitBill.populate('createdBy', 'name avatar');
  await updatedSplitBill.populate('participants.userId', 'name avatar');
  await updatedSplitBill.populate({
    path: 'groupId',
    select: 'name',
    options: { allowEmpty: true }
  });

  // Emit real-time update via socket
  console.log('🔌 Checking io instance:', !!io);
  if (io) {
    try {
      // Transform split bill data for frontend
      const splitBillData = {
        splitBillId: updatedSplitBill._id.toString(),
        description: updatedSplitBill.description,
        totalAmount: updatedSplitBill.totalAmount,
        userShare: participant.amount, // The current user's share
        isPaid: participant.isPaid,
        participants: updatedSplitBill.participants.map(p => ({
          userId: p.userId._id ? p.userId._id.toString() : p.userId.toString(),
          name: p.userId.name || 'Unknown',
          amount: p.amount,
          isPaid: p.isPaid,
          isRejected: p.isRejected || false
        }))
      };

      console.log('📤 Prepared splitBillData for socket emission:', {
        splitBillId: splitBillData.splitBillId,
        isPaid: splitBillData.isPaid,
        participantsCount: splitBillData.participants.length,
        participants: splitBillData.participants
      });

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
        console.log('📤 Emitting to direct split bill participants...');
        splitBill.participants.forEach(participant => {
          const roomName = `user_${participant.userId}`;
          console.log(`  📤 Emitting to room: ${roomName}`);
          io.to(roomName).emit('splitBillUpdate', {
            type: 'payment-made',
            splitBillId: splitBill._id.toString(),
            splitBill: splitBillData,
            userId: userId,
            timestamp: new Date()
          });
        });
        // Also emit to creator
        const creatorRoomName = `user_${splitBill.createdBy}`;
        console.log(`  📤 Emitting to creator room: ${creatorRoomName}`);
        io.to(creatorRoomName).emit('splitBillUpdate', {
          type: 'payment-made',
          splitBillId: splitBill._id.toString(),
          splitBill: splitBillData,
          userId: userId,
          timestamp: new Date()
        });
        console.log(`✅ Emitted split bill payment update to ${splitBill.participants.length + 1} users`);
      }
    } catch (socketError) {
      console.error('⚠️ Failed to emit socket event for payment:', socketError);
      console.error('Stack:', socketError.stack);
      // Don't fail the payment operation if socket emission fails
    }
  } else {
    console.error('❌ IO instance not available - cannot emit socket event!');
  }

  // Send payment confirmation email
  try {
    await emailService.sendPaymentConfirmationEmail(
      userId, // payer
      splitBill.createdBy.toString(), // payee (creator)
      updatedSplitBill,
      participant.amount
    );
    console.log('✅ Payment confirmation email sent');
  } catch (emailError) {
    console.error('⚠️ Failed to send payment confirmation email:', emailError);
    // Don't fail the payment operation if email fails
  }

  return updatedSplitBill;
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

  // Check if bill is already settled - don't throw error, just return current state
  if (splitBill.isSettled) {
    console.log('ℹ️ Bill already settled, returning current state');
    // Continue to return the split bill and emit socket event
  }

  // Check if user is trying to reject their own bill
  if (splitBill.createdBy.toString() === userId) {
    throw new Error('Cannot reject your own bill');
  }

  // Mark participant as rejected (we'll add a rejected field to the schema)
  if (!participant.isRejected) {
    participant.isRejected = true;
    participant.rejectedAt = new Date();
  }

  // Check if all participants have rejected
  const allRejected = splitBill.participants.every(p => p.isRejected);

  if (allRejected) {
    // If all participants reject, cancel the bill
    splitBill.isCancelled = true;
    splitBill.cancelledAt = new Date();
    splitBill.cancelReason = 'All participants rejected the bill';
  }

  await splitBill.save();

  // Re-fetch the split bill to ensure we have a fresh document for population
  const updatedSplitBill = await SplitBill.findById(splitBillId);

  if (!updatedSplitBill) {
    throw new Error('Failed to retrieve updated split bill');
  }

  // Populate the response
  await updatedSplitBill.populate('createdBy', 'name avatar');
  await updatedSplitBill.populate('participants.userId', 'name avatar');
  await updatedSplitBill.populate({
    path: 'groupId',
    select: 'name',
    options: { allowEmpty: true }
  });

  // Emit real-time update via socket
  if (io) {
    try {
      // Transform split bill data for frontend
      const splitBillData = {
        splitBillId: updatedSplitBill._id.toString(),
        description: updatedSplitBill.description,
        totalAmount: updatedSplitBill.totalAmount,
        userShare: participant.amount, // The current user's share
        isPaid: participant.isPaid,
        participants: updatedSplitBill.participants.map(p => ({
          userId: p.userId._id ? p.userId._id.toString() : p.userId.toString(),
          name: p.userId.name || 'Unknown',
          amount: p.amount,
          isPaid: p.isPaid,
          isRejected: p.isRejected || false
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

  return updatedSplitBill;
};

module.exports = {
  createSplitBill,
  markPaymentAsPaid,
  rejectSplitBill
};