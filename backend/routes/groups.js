const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const SplitBill = require('../models/SplitBill');
const auth = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Generate unique invite code
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Get user groups
router.get('/', auth, async (req, res) => {
  try {
    let groups = await Group.find({
      'members.userId': req.userId,
      isActive: true
    }).sort('-createdAt');
    
    // If user has no groups, create default groups
    if (groups.length === 0) {
      const defaultGroups = [
        {
          name: 'Personal',
          description: 'Personal expenses and finances',
          inviteCode: generateInviteCode(),
          members: [{
            userId: req.userId,
            role: 'admin'
          }]
        },
        {
          name: 'Family',
          description: 'Family shared expenses',
          inviteCode: generateInviteCode(),
          members: [{
            userId: req.userId,
            role: 'admin'
          }]
        }
      ];
      
      // Create default groups
      const createdGroups = await Group.insertMany(defaultGroups);
      groups = createdGroups;
    }
    
    res.json({
      status: 'success',
      data: { groups }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch groups' 
    });
  }
});

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const inviteCode = generateInviteCode();
    
    const group = new Group({
      name,
      description,
      inviteCode,
      members: [{
        userId: req.userId,
        role: 'admin'
      }]
    });

    await group.save();
    res.status(201).json({
      status: 'success',
      data: { 
        message: 'Group created successfully',
        group 
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to create group' 
    });
  }
});

// Join group with invite code
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    
    const group = await Group.findOne({ 
      inviteCode,
      isActive: true,
      'settings.allowInvites': true
    });

    if (!group) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Invalid or expired invite code' 
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(m => m.userId.toString() === req.userId && m.isActive);
    if (isMember) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Already a member of this group' 
      });
    }

    // Add user to group
    group.members.push({
      userId: req.userId,
      role: 'member'
    });

    await group.save();

    // Add group to user's groups
    const user = await User.findById(req.userId);
    if (user && user.groups) {
      user.groups.push(group._id);
      await user.save();
    }

    await group.populate('members.userId', 'name email avatar');

    res.json({ 
      status: 'success',
      data: { 
        message: 'Successfully joined group',
        group 
      } 
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error while joining group'
    });
  }
});

// Get group details
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      'members.userId': req.userId,
      isActive: true
    }).populate('members.userId', 'name email avatar');

    if (!group) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Group not found' 
      });
    }

    // Get group expenses and split bills
    const splitBills = await SplitBill.find({ groupId: group._id })
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: {
        group,
        splitBills
      }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email } = req.body;

    const group = await Group.findOne({
      _id: req.params.id,
      'members.userId': req.userId,
      'members.role': 'admin'
    });

    if (!group) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Group not found or insufficient permissions' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => 
      member.userId.toString() === user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ 
        status: 'error',
        message: 'User is already a member' 
      });
    }

    // Add member
    group.members.push({
      userId: user._id,
      role: 'member'
    });

    await group.save();

    // Add group to user
    user.groups.push(group._id);
    await user.save();

    await group.populate('members.userId', 'name email avatar');

    res.json({
      status: 'success',
      data: {
        message: 'Member added successfully',
        group
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Split bill
router.post('/:id/split', auth, async (req, res) => {
  try {
    const { description, amount, participants, splitType = 'equal' } = req.body;

    const group = await Group.findOne({
      _id: req.params.id,
      'members.userId': req.userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Group not found' 
      });
    }

    // Validate inputs
    if (!description || !amount || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: description, amount, and participants'
      });
    }

    // Calculate splits
    let splitParticipants = [];
    
    if (splitType === 'equal') {
      const equalPercentage = 100 / participants.length;
      const splitAmount = amount / participants.length;
      
      splitParticipants = participants.map(userId => ({
        userId: userId,
        amount: parseFloat(splitAmount.toFixed(2)),
        percentage: equalPercentage,
        isPaid: false
      }));
    } else if (splitType === 'percentage') {
      // Validate percentages sum to 100
      const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({
          status: 'error',
          message: 'Percentages must sum to 100%'
        });
      }

      splitParticipants = participants.map(p => ({
        userId: p.userId,
        amount: parseFloat(((amount * p.percentage) / 100).toFixed(2)),
        percentage: p.percentage,
        isPaid: false
      }));
    }

    // Create the split bill with all required fields
    const splitBill = new SplitBill({
      description: description.trim(),
      totalAmount: parseFloat(amount.toFixed(2)),
      currency: 'USD', // Default currency
      createdBy: req.userId,
      groupId: group._id,
      participants: splitParticipants,
      splitType: splitType,
      category: 'Other', // Default category
      isSettled: false
    });

    await splitBill.save();
    await splitBill.populate('createdBy', 'name avatar');
    await splitBill.populate('participants.userId', 'name avatar');

    res.status(201).json({
      status: 'success',
      data: {
        message: 'Bill split successfully',
        splitBill
      }
    });
  } catch (error) {
    console.error('Split bill error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Generate new invite code
router.post('/:id/invite-code', auth, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      'members.userId': req.userId,
      'members.role': 'admin',
      isActive: true
    });

    if (!group) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Group not found or insufficient permissions' 
      });
    }

    group.inviteCode = generateInviteCode();
    await group.save();

    res.json({
      status: 'success',
      data: {
        message: 'New invite code generated',
        inviteCode: group.inviteCode
      }
    });
  } catch (error) {
    console.error('Generate invite code error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Get group stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    
    // Check if user is member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.userId': req.userId,
      isActive: true
    });
    
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found or access denied'
      });
    }
    
    // Get split bills for the group
    const splitBills = await SplitBill.find({
      groupId: groupId
    }).populate('createdBy', 'name username')
      .populate('participants.userId', 'name username');
    
    // Calculate stats
    const totalAmount = splitBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const count = splitBills.length;
    const settled = splitBills.filter(bill => bill.isSettled || false).length;
    const pending = count - settled;
    
    // Group by category
    const categoryMap = new Map();
    splitBills.forEach(bill => {
      const category = bill.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, amount: 0, count: 0 });
      }
      const categoryData = categoryMap.get(category);
      categoryData.amount += bill.totalAmount || 0;
      categoryData.count += 1;
    });
    
    // Group by participant
    const participantMap = new Map();
    splitBills.forEach(bill => {
      if (bill.participants && Array.isArray(bill.participants)) {
        bill.participants.forEach(participant => {
          const userId = participant.userId?._id || participant.userId;
          const userName = participant.userId?.name || 'Unknown';
          if (!participantMap.has(userId.toString())) {
            participantMap.set(userId.toString(), { 
              userId: userId.toString(), 
              name: userName, 
              totalAmount: 0, 
              billCount: 0 
            });
          }
          const participantData = participantMap.get(userId.toString());
          participantData.totalAmount += participant.amount || 0;
          participantData.billCount += 1;
        });
      }
    });
    
    res.json({
      status: 'success',
      data: {
        overview: {
          totalAmount,
          count,
          settled,
          pending
        },
        byCategory: Array.from(categoryMap.values()),
        byParticipant: Array.from(participantMap.values())
      }
    });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch group stats'
    });
  }
});

module.exports = router;