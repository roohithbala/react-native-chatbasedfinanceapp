const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');

/**
 * Validates split bill creation data
 * @param {Object} data - Split bill data
 * @returns {Object} - Validation result with isValid and message
 */
const validateSplitBillData = (data) => {
  const { description, totalAmount, participants } = data;

  if (!description || !totalAmount || !participants || !participants.length) {
    return { isValid: false, message: 'Description, total amount, and participants are required' };
  }

  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    return { isValid: false, message: 'Total amount must be a positive number' };
  }

  return { isValid: true };
};

/**
 * Validates group split bill participants
 * @param {string} groupId - Group ID
 * @param {Array} participants - Array of participant objects
 * @param {string} userId - Creator user ID
 * @returns {Object} - Validation result
 */
const validateGroupSplitBill = async (groupId, participants, userId) => {
  try {
    console.log('🔍 Validating group split bill:', { groupId, userId, participantCount: participants?.length });

    const group = await Group.findById(groupId);
    if (!group) {
      console.log('❌ Group not found:', groupId);
      return { isValid: false, message: 'Group not found' };
    }

    console.log('✅ Group found:', group.name, 'Members:', group.members?.length);

    // Check if user is a member (more robust check)
    const userMember = group.members?.find(m => m.userId?.toString() === userId.toString());
    if (!userMember) {
      console.log('❌ User is not a member of the group');
      return { isValid: false, message: 'You must be a member of the group to create split bills' };
    }

    // Check if user is active (default to true if not set)
    const isActive = userMember.isActive !== false; // Default to true if undefined
    if (!isActive) {
      console.log('❌ User membership is not active');
      return { isValid: false, message: 'Your membership in this group is not active' };
    }

    console.log('✅ User is active member of group');

    // Get active group member IDs
    const groupMemberIds = group.members
      ?.filter(m => m.isActive !== false) // Default to true if undefined
      ?.map(m => m.userId?.toString())
      ?.filter(id => id) || []; // Filter out undefined IDs

    console.log('📋 Active group members:', groupMemberIds.length);

    // Check if all participants are active members
    const invalidParticipants = participants.filter(p => {
      const isValid = groupMemberIds.includes(p.userId);
      if (!isValid) {
        console.log('❌ Invalid participant:', p.userId, 'not in group members');
      }
      return !isValid;
    });

    if (invalidParticipants.length > 0) {
      console.log('❌ Found invalid participants:', invalidParticipants.length);
      return { isValid: false, message: 'All participants must be active members of the group' };
    }

    console.log('✅ All participants are valid group members');
    return { isValid: true, group };
  } catch (error) {
    console.error('❌ Error validating group:', error);
    return { isValid: false, message: 'Error validating group: ' + error.message };
  }
};

/**
 * Validates direct chat split bill participants
 * @param {Array} participants - Array of participant objects
 * @param {string} userId - Creator user ID
 * @returns {Object} - Validation result
 */
const validateDirectSplitBill = async (participants, userId) => {
  try {
    const participantIds = participants.map(p => p.userId);

    // Remove duplicates
    const uniqueParticipantIds = [...new Set(participantIds)];

    if (uniqueParticipantIds.length !== participantIds.length) {
      return { isValid: false, message: 'Duplicate participants are not allowed' };
    }

    // Check that creator is not trying to split with themselves only
    const otherParticipants = uniqueParticipantIds.filter(id => id !== userId.toString());
    if (otherParticipants.length === 0) {
      return { isValid: false, message: 'Cannot create split bill with only yourself' };
    }

    const users = await User.find({ _id: { $in: uniqueParticipantIds } });

    if (users.length !== uniqueParticipantIds.length) {
      return { isValid: false, message: 'One or more participants not found' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: 'Error validating participants' };
  }
};

/**
 * Validates participant amounts
 * @param {Array} participants - Array of participant objects
 * @param {number} totalAmount - Total split bill amount
 * @returns {Object} - Validation result
 */
const validateParticipantAmounts = (participants, totalAmount) => {
  try {
    const totalParticipantAmount = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (Math.abs(totalAmount - totalParticipantAmount) > 0.01) {
      return { isValid: false, message: 'Sum of participant amounts must equal total amount' };
    }

    const invalidAmounts = participants.filter(p => !p.amount || p.amount <= 0);
    if (invalidAmounts.length > 0) {
      return { isValid: false, message: 'All participants must have valid positive amounts' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: 'Error validating amounts' };
  }
};

module.exports = {
  validateSplitBillData,
  validateGroupSplitBill,
  validateDirectSplitBill,
  validateParticipantAmounts
};