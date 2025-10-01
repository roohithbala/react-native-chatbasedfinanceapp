const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const User = require('../models/User');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// Start a new call
router.post('/start', auth, async (req, res) => {
  try {
    const { participants, type, groupId } = req.body;
    const initiatorId = req.user.userId;

    // Validate input
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants array is required' });
    }

    if (!['voice', 'video'].includes(type)) {
      return res.status(400).json({ message: 'Invalid call type. Must be voice or video' });
    }

    // Verify all participants exist
    const participantUsers = await User.find({ _id: { $in: participants } });
    if (participantUsers.length !== participants.length) {
      return res.status(400).json({ message: 'One or more participants not found' });
    }

    // If group call, verify group exists and user is member
    let group = null;
    if (groupId) {
      group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const isMember = group.members.some(member =>
        member.userId.toString() === initiatorId
      );
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }
    }

    // Generate unique call ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create call record
    const call = new Call({
      callId,
      type,
      initiator: initiatorId,
      participants: participants.map(userId => ({
        userId,
        status: userId === initiatorId ? 'joined' : 'invited'
      })),
      groupId: groupId || null,
      startTime: new Date()
    });

    await call.save();

    // Populate participant details
    await call.populate('participants.userId', 'name username avatar');
    await call.populate('initiator', 'name username avatar');
    if (groupId) {
      await call.populate('groupId', 'name');
    }

    res.status(201).json({
      message: 'Call started successfully',
      call: {
        callId: call.callId,
        type: call.type,
        status: call.status,
        initiator: call.initiator,
        participants: call.participants,
        groupId: call.groupId,
        startTime: call.startTime
      }
    });

  } catch (error) {
    console.error('Error starting call:', error);
    res.status(500).json({ message: 'Failed to start call', error: error.message });
  }
});

// Join an existing call
router.post('/join/:callId', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this call' });
    }

    // Update participant status
    await call.updateParticipantStatus(userId, 'joined', new Date());

    res.json({
      message: 'Joined call successfully',
      call: {
        callId: call.callId,
        type: call.type,
        status: call.status,
        participants: call.participants,
        startTime: call.startTime
      }
    });

  } catch (error) {
    console.error('Error joining call:', error);
    res.status(500).json({ message: 'Failed to join call', error: error.message });
  }
});

// End a call
router.post('/end/:callId', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this call' });
    }

    // Update participant status
    await call.updateParticipantStatus(userId, 'left', null, new Date());

    // If this is the last participant or the initiator ending the call, end the call
    const activeParticipants = call.participants.filter(p =>
      p.status === 'joined' && p.userId.toString() !== userId
    );

    if (activeParticipants.length === 0 || call.initiator.toString() === userId) {
      await call.endCall();
    }

    res.json({ message: 'Call ended successfully' });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ message: 'Failed to end call', error: error.message });
  }
});

// Get call details
router.get('/:callId', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ callId })
      .populate('participants.userId', 'name username avatar')
      .populate('initiator', 'name username avatar')
      .populate('groupId', 'name');

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is a participant
    const isParticipant = call.participants.some(p => p.userId._id.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not authorized to view this call' });
    }

    res.json({ call });

  } catch (error) {
    console.error('Error getting call details:', error);
    res.status(500).json({ message: 'Failed to get call details', error: error.message });
  }
});

// Get active calls for user
router.get('/active/user', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const activeCalls = await Call.findActiveCallsForUser(userId);

    res.json({ calls: activeCalls });

  } catch (error) {
    console.error('Error getting active calls:', error);
    res.status(500).json({ message: 'Failed to get active calls', error: error.message });
  }
});

// Get call history for user
router.get('/history/user', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, skip = 0 } = req.query;

    const callHistory = await Call.getCallHistoryForUser(userId, parseInt(limit), parseInt(skip));

    res.json({ calls: callHistory });

  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({ message: 'Failed to get call history', error: error.message });
  }
});

// Decline a call
router.post('/decline/:callId', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this call' });
    }

    // Update participant status to declined
    await call.updateParticipantStatus(userId, 'declined');

    res.json({ message: 'Call declined successfully' });

  } catch (error) {
    console.error('Error declining call:', error);
    res.status(500).json({ message: 'Failed to decline call', error: error.message });
  }
});

module.exports = router;