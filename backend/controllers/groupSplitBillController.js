const Group = require('../models/Group');
const SplitBill = require('../models/SplitBill');
const {
  validateGroupMembership,
  calculateSplitParticipants
} = require('../utils/groupUtils');

/**
 * Create split bill for group
 * @param {string} groupId - Group ID
 * @param {Object} billData - Bill data
 * @param {string} userId - User ID creating the bill
 * @returns {Object} - Created split bill
 */
const splitBill = async (groupId, billData, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  const { totalAmount, description, participants } = billData;

  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Total amount must be greater than 0');
  }

  if (!description || description.trim().length === 0) {
    throw new Error('Description is required');
  }

  // Calculate participants if not provided
  let billParticipants = participants;
  if (!billParticipants || billParticipants.length === 0) {
    billParticipants = calculateSplitParticipants(group.members, totalAmount);
  }

  // Validate participants
  const groupMemberIds = group.members.map(m => m.userId.toString());
  const invalidParticipants = billParticipants.filter(p =>
    !groupMemberIds.includes(p.userId.toString())
  );

  if (invalidParticipants.length > 0) {
    throw new Error('All participants must be group members');
  }

  // Create split bill
  const splitBill = new SplitBill({
    totalAmount,
    description: description.trim(),
    participants: billParticipants.map(p => ({
      userId: p.userId,
      amount: p.amount,
      groupId: groupId
    })),
    createdBy: userId,
    groupId: groupId
  });

  await splitBill.save();
  await splitBill
    .populate('participants.userId', 'name avatar')
    .populate('createdBy', 'name avatar');

  return splitBill;
};

module.exports = {
  splitBill
};