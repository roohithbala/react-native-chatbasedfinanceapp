const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const chatUtils = require('../utils/chatUtils');
const commandUtils = require('../utils/commandUtils');

/**
 * Send a message to a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID sending the message
 * @param {Object} messageData - Message data
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Created message data
 */
const sendMessage = async (groupId, userId, messageData, io) => {
  const { text, type = 'text' } = messageData;

  if (!text?.trim()) {
    throw new Error('Message text is required');
  }

  // Get user info
  const user = await User.findById(userId).select('name avatar username');
  if (!user) {
    throw new Error('User not found');
  }

  const group = await chatUtils.validateGroupMembership(groupId, userId);

  let commandResult = null;
  let systemMessage = null;

  // Handle commands
  if (text.startsWith('@')) {
    try {
      commandResult = await commandUtils.parseAndExecuteCommand(text, userId, groupId, user);

      if (commandResult.success) {
        let resultText = '';

        switch (commandResult.type) {
          case 'split':
            const splitAmount = commandResult.data.splitAmount !== undefined && commandResult.data.splitAmount !== null ?
              Number(commandResult.data.splitAmount) : 0;
            const splitAmountFormatted = isNaN(splitAmount) ? '0.00' : splitAmount.toFixed(2);
            const participants = commandResult.data.participants || [];
            resultText = `💰 Split bill created:\n${commandResult.data.description || 'Unknown'}\nAmount: ₹${(commandResult.data.amount || 0).toFixed(2)}\nSplit: ₹${splitAmountFormatted} each\nParticipants: ${participants.map(p => p.name || 'Unknown').join(', ') || 'None'}`;
            break;

          case 'expense':
            const expenseAmount = commandResult.data.amount !== undefined && commandResult.data.amount !== null ?
              Number(commandResult.data.amount) : 0;
            const expenseAmountFormatted = isNaN(expenseAmount) ? '0.00' : expenseAmount.toFixed(2);
            resultText = `📝 Expense added:\n${commandResult.data.description || 'Unknown'}\nAmount: ₹${expenseAmountFormatted}\nCategory: #${commandResult.data.category || 'Other'}`;
            break;

          case 'predict':
            resultText = `🔮 ${commandResult.data.prediction || 'Unable to generate prediction'}`;
            break;

          case 'summary':
            const expenses = commandResult.data.transactions || [];
            const totals = commandResult.data.totals || { total: 0, expenses: 0, splitBills: 0 };

            // Safely format the total amount
            const totalAmount = totals.total !== undefined && totals.total !== null ?
              Number(totals.total) : 0;
            const formattedTotal = isNaN(totalAmount) ? '0.00' : totalAmount.toFixed(2);

            resultText = `📊 Recent Group Expenses (Total: ₹${formattedTotal}):\n${
              expenses.length > 0
                ? expenses.map(exp => {
                    const amount = exp.amount !== undefined && exp.amount !== null ?
                      Number(exp.amount) : 0;
                    const formattedAmount = isNaN(amount) ? '0.00' : amount.toFixed(2);
                    return `• ${exp.description || 'Unknown'}: ₹${formattedAmount} by ${exp.by || 'Unknown'}`;
                  }).join('\n')
                : 'No recent transactions found'
            }`;
            break;
        }

        // Create system message for command result
        systemMessage = new Message({
          text: resultText,
          user: {
            _id: new mongoose.Types.ObjectId('000000000000000000000000'), // Use a fixed ObjectId for system
            name: 'AI Assistant',
            username: 'ai',
            avatar: '🤖'
          },
          groupId,
          type: 'system',
          status: 'sent',
          readBy: []
        });

        await systemMessage.save();
      }
    } catch (cmdError) {
      // Create error message but don't stop execution
      systemMessage = new Message({
        text: `❌ Error: ${cmdError.message}`,
        user: {
          _id: new mongoose.Types.ObjectId('000000000000000000000000'), // Use a fixed ObjectId for system
          name: 'AI Assistant',
          username: 'ai',
          avatar: '🤖'
        },
        groupId,
        type: 'system',
        status: 'sent',
        readBy: []
      });

      await systemMessage.save();
    }
  }

  // Extract mentions
  const mentions = await chatUtils.extractMentions(text);

  // Save the original user message
  const message = new Message({
    text: text.trim(),
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    },
    groupId,
    type: commandResult?.success && commandResult.type === 'split' ? 'split_bill' : (commandResult?.success ? 'command' : type),
    status: 'sent',
    commandType: commandResult?.type,
    mentions,
    readBy: [{
      userId: userId,
      readAt: new Date()
    }]
  });

  // If it's a split command, add split bill data
  if (commandResult?.success && commandResult.type === 'split') {
    // Get the created split bill details
    const SplitBill = require('../models/SplitBill');
    const splitBill = await SplitBill.findById(commandResult.data.splitBillId)
      .populate('participants.userId', 'name username')
      .populate('createdBy', 'name username');

    if (splitBill) {
      // Find current user's share
      const userParticipant = splitBill.participants.find(p => p.userId._id.toString() === userId.toString());
      const userShare = userParticipant ? userParticipant.amount : 0;

      message.splitBillData = {
        splitBillId: splitBill._id.toString(),
        description: splitBill.description,
        totalAmount: splitBill.totalAmount,
        userShare: userShare,
        isPaid: userParticipant ? userParticipant.isPaid : false,
        participants: splitBill.participants.map(p => ({
          userId: p.userId._id.toString(),
          name: p.userId.name || 'Unknown',
          amount: p.amount,
          isPaid: p.isPaid
        }))
      };
    }
  }
  // If it's a command, add command data
  else if (commandResult?.success) {
    message.commandData = commandResult.data;
  }

  await message.save();

  const response = {
    message: await Message.findById(message._id)
      .populate('user', 'name avatar username')
      .lean()
      .then(msg => chatUtils.formatMessage(msg))
  };

  if (systemMessage) {
    response.systemMessage = {
      _id: systemMessage._id.toString(),
      text: systemMessage.text,
      createdAt: systemMessage.createdAt.toISOString(),
      user: {
        _id: 'system',
        name: 'AI Assistant',
        username: 'ai',
        avatar: '🤖'
      },
      type: 'system',
      status: 'sent'
    };
  }

  // Emit socket events for real-time updates
  if (io) {
    // Format message for socket emission
    const socketMessage = chatUtils.formatMessageForSocket(message);

    // Emit to all group members
    io.to(groupId).emit('receive-message', socketMessage);

    // Also emit system message if it exists
    if (systemMessage) {
      const socketSystemMessage = chatUtils.formatSystemMessageForSocket(systemMessage, groupId, commandResult);
      io.to(groupId).emit('receive-message', socketSystemMessage);
    }
  }

  return response;
};

/**
 * Mark messages as read
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID marking messages as read
 * @param {Array} messageIds - Array of message IDs to mark as read
 * @returns {Object} - Success response
 */
const markMessagesAsRead = async (groupId, userId, messageIds) => {
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      groupId,
      'readBy.userId': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          userId: userId,
          readAt: new Date()
        }
      }
    }
  );

  return {
    message: 'Messages marked as read'
  };
};

/**
 * Add reaction to a message
 * @param {string} groupId - Group ID
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID adding the reaction
 * @param {string} emoji - Emoji for the reaction
 * @returns {Object} - Updated reactions
 */
const addReactionToMessage = async (groupId, messageId, userId, emoji) => {
  const message = await Message.findOne({
    _id: messageId,
    groupId
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Remove existing reaction from user
  message.reactions = message.reactions.filter(
    reaction => reaction.userId.toString() !== userId
  );

  // Add new reaction
  if (emoji) {
    message.reactions.push({
      userId: userId,
      emoji
    });
  }

  await message.save();

  return {
    message: 'Reaction updated successfully',
    reactions: message.reactions
  };
};

module.exports = {
  sendMessage,
  markMessagesAsRead,
  addReactionToMessage
};