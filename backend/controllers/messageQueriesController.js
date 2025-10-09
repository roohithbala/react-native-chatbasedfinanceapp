const Message = require('../models/Message');
const chatUtils = require('../utils/chatUtils');

/**
 * Get messages for a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID requesting messages
 * @returns {Object} - Messages data with group info
 */
const getGroupMessages = async (groupId, userId) => {
  console.log('📥 getGroupMessages called:', { groupId, userId });
  
  const group = await chatUtils.validateGroupMembership(groupId, userId);
  console.log('✅ Group validated:', { groupId: group._id, name: group.name });

  const messages = await Message.find({ groupId })
    .sort({ createdAt: 1 })
    .limit(50)
    .populate({
      path: 'user',
      select: 'name avatar username _id'
    })
    .lean();

  console.log('📊 Messages found:', {
    count: messages.length,
    groupId,
    firstMessage: messages[0] ? {
      _id: messages[0]._id,
      text: messages[0].text?.substring(0, 50),
      type: messages[0].type
    } : null
  });

  const formattedMessages = messages.map(msg => chatUtils.formatMessage(msg));

  return {
    messages: formattedMessages,
    group: {
      _id: group._id,
      name: group.name,
      members: group.members
    }
  };
};

module.exports = {
  getGroupMessages
};