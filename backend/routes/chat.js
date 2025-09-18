const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const SplitBill = require('../models/SplitBill');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// Response formatter for messages
const formatMessage = (message) => {
  // Ensure message is an object after lean() query
  const msg = message.toObject ? message.toObject() : message;

  return {
    _id: msg._id.toString(),
    text: msg.text,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    user: msg.type === 'system' ? {
      _id: 'system',
      name: 'AI Assistant',
      avatar: '🤖'
    } : {
      _id: msg.user._id?.toString() || msg.user._id,
      name: msg.user.name || '',
      avatar: msg.user.avatar || '',
      username: msg.user.username || ''
    },
    type: msg.type || 'text',
    status: msg.status || 'sent',
    groupId: msg.groupId?.toString(),
    readBy: (msg.readBy || []).map(r => ({
      userId: r.userId.toString(),
      readAt: r.readAt instanceof Date ? r.readAt.toISOString() : r.readAt
    })),
    commandType: msg.commandType || null,
    commandData: msg.commandData || null,
    systemData: msg.systemData || null,
    mediaUrl: msg.mediaUrl || null,
    mediaType: msg.mediaType || null,
    mediaSize: msg.mediaSize || 0,
    mentions: (msg.mentions || []).map(m => m.toString()),
    reactions: (msg.reactions || []).map(r => ({
      userId: r.userId.toString(),
      emoji: r.emoji,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt
    }))
  };
};

const router = express.Router();

// Helper function to extract mentions from message
const extractMentions = async (text) => {
  try {
    const mentions = text.match(/@(\w+)/g) || [];
    const usernames = mentions.map(m => m.substring(1));
    
    if (usernames.length === 0) return [];
    
    const users = await User.find({
      username: { $in: usernames }
    }).select('_id');
    
    return users.map(u => u._id);
  } catch (error) {
    console.error('Error extracting mentions:', error);
    return [];
  }
};

    // Get group messages
router.get('/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid group ID format' });
    }
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ status: 'error', message: 'Group not found' });
    }

    // Check if user is member of the group
    if (!group.members.some(member => member.userId.toString() === req.userId.toString() && member.isActive)) {
      return res.status(403).json({ status: 'error', message: 'You are not a member of this group' });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: 'user',
        select: 'name avatar username _id'
      })
      .lean();

    const formattedMessages = messages.map(msg => formatMessage(msg));

    res.json({ 
      status: 'success',
      data: {
        messages: formattedMessages,
        group: {
          _id: group._id,
          name: group.name,
          members: group.members
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch messages',
      error: error.message 
    });
  }
});

  // Send message
router.post('/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, type = 'text' } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Message text is required'
      });
    }

    // Get user info
    const user = await User.findById(req.user._id).select('name avatar username');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member of the group
    const isMember = group.members.some(member => 
      member.userId.toString() === req.userId.toString() && member.isActive
    );
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    let commandResult = null;
    let systemMessage = null;

    // Handle commands
    if (text.startsWith('@')) {
      try {
        commandResult = await parseAndExecuteCommand(text, req.userId, groupId, req.user);
        
        if (commandResult.success) {
          let resultText = '';
          
          switch (commandResult.type) {
            case 'split':
              resultText = `💰 Split bill created:\n${commandResult.data.description}\nAmount: $${commandResult.data.amount}\nSplit: $${commandResult.data.splitAmount.toFixed(2)} each\nParticipants: ${commandResult.data.participants.join(', ')}`;
              break;
            
            case 'expense':
              resultText = `📝 Expense added:\n${commandResult.data.description}\nAmount: $${commandResult.data.amount}\nCategory: #${commandResult.data.category}`;
              break;
            
            case 'predict':
              resultText = `🔮 ${commandResult.data.prediction}`;
              break;
            
            case 'summary':
              const expenses = commandResult.data.expenses;
              resultText = `📊 Recent Group Expenses (Total: $${commandResult.data.total.toFixed(2)}):\n${
                expenses.map(exp => 
                  `• ${exp.description}: $${exp.amount} by ${exp.by}`
                ).join('\n')
              }`;
              break;
          }

          // Create system message for command result
          systemMessage = new Message({
            text: resultText,
            user: {
              _id: new mongoose.Types.ObjectId('000000000000000000000000'), // Use a fixed ObjectId for system
              name: 'AI Assistant',
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

    // Extract mentions from the message
    const mentions = await extractMentions(text);

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
      type: commandResult?.success ? 'command' : type,
      status: 'sent',
      commandType: commandResult?.type,
      mentions,
      readBy: [{
        userId: req.userId,
        readAt: new Date()
      }]
    });

    // If it's a command, add command data
    if (commandResult?.success) {
      message.commandData = commandResult.data;
    }

    await message.save();

    const response = {
      status: 'success',
      data: {
        message: await Message.findById(message._id)
          .populate('user', 'name avatar username')
          .lean()
          .then(msg => formatMessage(msg))
      }
    };

    if (systemMessage) {
      response.data.systemMessage = {
        _id: systemMessage._id.toString(),
        text: systemMessage.text,
        createdAt: systemMessage.createdAt.toISOString(),
        user: {
          _id: 'system',
          name: 'AI Assistant',
          avatar: '🤖'
        },
        type: 'system',
        status: 'sent'
      };
    }

    // Emit socket events for real-time updates
    if (req.io) {
      // Format message for socket emission
      const socketMessage = {
        _id: message._id.toString(),
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        user: {
          _id: message.user._id.toString(),
          name: message.user.name,
          username: message.user.username,
          avatar: message.user.avatar
        },
        type: message.type,
        status: 'sent',
        groupId: groupId,
        readBy: message.readBy,
        mentions: message.mentions,
        reactions: message.reactions
      };

      // Emit to all group members
      req.io.to(groupId).emit('receive-message', socketMessage);

      // Also emit system message if it exists
      if (systemMessage) {
        const socketSystemMessage = {
          _id: systemMessage._id.toString(),
          text: systemMessage.text,
          createdAt: systemMessage.createdAt.toISOString(),
          user: {
            _id: 'system',
            name: 'AI Assistant',
            avatar: '🤖'
          },
          type: 'system',
          status: 'sent',
          groupId: groupId,
          readBy: [],
          commandType: commandResult?.type,
          commandData: commandResult?.data || {},
          mentions: [],
          reactions: []
        };

        req.io.to(groupId).emit('receive-message', socketSystemMessage);
      }
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error.message 
    });
  }
});

// Mark messages as read
router.put('/:groupId/messages/read', auth, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const { groupId } = req.params;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        groupId,
        'readBy.userId': { $ne: req.userId }
      },
      {
        $push: {
          readBy: {
            userId: req.userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      status: 'success',
      data: {
        message: 'Messages marked as read'
      }
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read'
    });
  }
});

// Add reaction to message
router.post('/:groupId/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const { groupId, messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      groupId
    });

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    // Remove existing reaction from user
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== req.userId
    );

    // Add new reaction
    if (emoji) {
      message.reactions.push({
        userId: req.userId,
        emoji
      });
    }

    await message.save();

    res.json({
      status: 'success',
      data: {
        message: 'Reaction updated successfully',
        reactions: message.reactions
      }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update reaction'
    });
  }
});

// Helper function to parse financial commands
async function parseAndExecuteCommand(text, userId, groupId, user) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.startsWith('@split')) {
    const parts = text.split(' ');
    const description = parts.slice(1).join(' ').split('$')[0].trim() || 'Split Bill';
    const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const mentions = text.match(/@\w+/g) || [];
    
    // If no participants are mentioned, split with all group members
    let participants;
    if (mentions.length <= 1) { // Only @split command
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }
      participants = group.members
        .filter(m => m.isActive && m.userId.toString() !== userId.toString())
        .map(m => m.userId);
    } else {
      // For mentioned participants, get their user IDs
      const usernames = mentions.slice(1).map(p => p.replace('@', ''));
      const users = await User.find({ username: { $in: usernames } });
      if (users.length !== mentions.length - 1) {
        throw new Error('One or more mentioned users not found');
      }
      participants = users.map(u => u._id);
    }

    if (amount <= 0) {
      throw new Error('Invalid amount for split bill');
    }

    if (participants.length === 0) {
      throw new Error('No participants mentioned for split bill');
    }

    // Get participant user IDs
    const usernames = participants.map(p => p.replace('@', ''));
    const users = await User.find({ username: { $in: usernames } })
      .select('_id username name');
    
    if (users.length !== participants.length) {
      const foundUsernames = users.map(u => u.username);
      const missingUsers = usernames.filter(u => !foundUsernames.includes(u));
      throw new Error(`User(s) not found: ${missingUsers.join(', ')}`);
    }

    // Calculate split amount
    const totalParticipants = users.length + 1; // Include the creator
    const splitAmount = Number((amount / totalParticipants).toFixed(2));
    const roundingAdjustment = amount - (splitAmount * totalParticipants);

    // Create or get existing split bill group
    let splitGroup = await Group.findOne({
      members: { 
        $all: [
          { $elemMatch: { userId: userId } },
          ...users.map(u => ({ $elemMatch: { userId: u._id } }))
        ],
        $size: totalParticipants
      }
    });

    if (!splitGroup) {
      const memberNames = [...users.map(u => u.name), user.name];
      splitGroup = new Group({
        name: `Split Bill - ${memberNames.join(', ')}`,
        description: 'Automatic group for split bills',
        createdBy: userId,
        members: [
          { userId: userId, role: 'admin', isActive: true },
          ...users.map(u => ({
            userId: u._id,
            role: 'member',
            isActive: true
          }))
        ]
      });
      await splitGroup.save();
    }

    // Create split bill with proper participant structure
    const splitBill = new SplitBill({
      description,
      totalAmount: amount,
      createdBy: userId,
      groupId: splitGroup._id,
      splitType: 'equal',
      participants: [
        // Creator always pays first to handle rounding
        {
          userId: userId,
          amount: splitAmount + roundingAdjustment,
          percentage: 100 / totalParticipants
        },
        ...users.map(u => ({
          userId: u._id,
          amount: splitAmount,
          percentage: 100 / totalParticipants
        }))
      ],
      category: 'Split',
      isSettled: false
    });

    await splitBill.save();

    // Create a corresponding expense for the group
    const groupExpense = new Expense({
      description,
      amount,
      category: 'Split',
      userId: userId,
      groupId: splitGroup._id,
      tags: ['split-bill'],
      isRecurring: false,
    });
    await groupExpense.save();

    // Get participant details for the response
    const participantDetails = await User.find({
      _id: { $in: [...participants, userId] }
    }).select('username name');

    const participantMap = participantDetails.reduce((acc, p) => {
      acc[p._id.toString()] = p;
      return acc;
    }, {});

    return {
      type: 'split',
      data: { 
        description, 
        amount,
        splitAmount: splitAmount,
        participants: participantDetails.map(p => ({
          username: p.username,
          name: p.name,
          amount: p._id.toString() === userId.toString() ? 
            splitAmount + roundingAdjustment : 
            splitAmount
        })),
        groupId: splitGroup._id,
        groupName: splitGroup.name,
        isNewGroup: splitGroup.createdAt === splitGroup.updatedAt,
        expenseId: groupExpense._id
      },
      success: true
    };
  } 
  
  else if (lowerText.startsWith('@addexpense')) {
    const parts = text.split(' ');
    const description = parts[1] || 'Expense';
    const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const categoryMatch = text.match(/#(\w+)/);
    const category = categoryMatch ? categoryMatch[1] : 'Other';

    if (amount <= 0) {
      throw new Error('Invalid amount for expense');
    }

    // Create expense
    const expense = new Expense({
      description,
      amount,
      category,
      userId,
      groupId
    });

    await expense.save();

    return {
      type: 'expense',
      data: { description, amount, category },
      success: true
    };
  } 
  
  else if (lowerText.startsWith('@predict')) {
    // Get user's spending history
    const expenses = await Expense.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);
    
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const average = total / (expenses.length || 1);

    return {
      type: 'predict',
      data: {
        prediction: `Based on your last ${expenses.length} expenses, you spend an average of $${average.toFixed(2)} per transaction.`
      },
      success: true
    };
  } 
  
  else if (lowerText.startsWith('@summary')) {
    // Get group expenses and split bills
    const [groupExpenses, splitBills] = await Promise.all([
      Expense.find({ groupId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name'),
      SplitBill.find({ groupId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name')
        .populate('participants.userId', 'name')
    ]);

    const summary = {
      expenses: groupExpenses.map(exp => ({
        description: exp.description,
        amount: exp.amount,
        by: exp.userId.name,
        date: exp.createdAt,
        type: 'expense',
        category: exp.category
      })),
      splitBills: splitBills.map(split => ({
        description: split.description,
        amount: split.totalAmount,
        by: split.createdBy.name,
        date: split.createdAt,
        type: 'split',
        participants: split.participants.map(p => ({
          name: p.userId.name,
          amount: p.amount,
          isPaid: p.isPaid
        }))
      }))
    };

    // Combine and sort by date
    const allTransactions = [...summary.expenses, ...summary.splitBills]
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);

    return {
      type: 'summary',
      data: { 
        transactions: allTransactions,
        totals: {
          expenses: summary.expenses.reduce((sum, exp) => sum + exp.amount, 0),
          splitBills: summary.splitBills.reduce((sum, split) => sum + split.amount, 0),
          total: summary.expenses.reduce((sum, exp) => sum + exp.amount, 0) + 
                summary.splitBills.reduce((sum, split) => sum + split.amount, 0)
        }
      },
      success: true
    };
  }

  return { type: 'unknown', data: {}, success: false };
}

module.exports = router;