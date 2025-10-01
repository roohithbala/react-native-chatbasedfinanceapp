const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');

const configureSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: [
        'http://10.255.29.172:8081',
        'http://localhost:8081',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectTimeout: 20000,
    maxHttpBufferSize: 1e8
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = { _id: decoded.userId, name: 'User' };
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track typing users per group
    const typingUsers = new Map();

    socket.on('join-group', (groupId) => {
      socket.join(groupId);
      socket.emit('group-joined', { groupId });
      console.log(`User ${socket.user?._id} joined group ${groupId}`);
    });

    socket.on('join-private-chat', (userId) => {
      socket.join(`private-${userId}`);
      socket.emit('private-chat-joined', { userId });
      console.log(`User ${socket.user?._id} joined private chat with ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user?._id);
    });

    // Call-related events
    socket.on('call-offer', (data) => {
      console.log('📞 Call offer from user:', socket.user._id, 'to participants:', data.participants);

      // Send offer to all participants except the caller
      data.participants.forEach(participantId => {
        if (participantId !== socket.user._id) {
          socket.to(`user-${participantId}`).emit('call-offer', {
            callId: data.callId,
            callerId: socket.user._id,
            callerName: socket.user.name || 'Unknown',
            participants: data.participants,
            type: data.type,
            offer: data.offer
          });
        }
      });
    });

    socket.on('call-answer', (data) => {
      console.log('📞 Call answer from user:', socket.user._id, 'for call:', data.callId);

      // Send answer back to the caller
      socket.to(`user-${data.callerId}`).emit('call-answer', {
        callId: data.callId,
        answer: data.answer,
        from: socket.user._id
      });
    });

    socket.on('ice-candidate', (data) => {
      console.log('🧊 ICE candidate from user:', socket.user._id, 'for call:', data.callId);

      // Send ICE candidate to other participants
      data.participants?.forEach(participantId => {
        if (participantId !== socket.user._id) {
          socket.to(`user-${participantId}`).emit('ice-candidate', {
            callId: data.callId,
            candidate: data.candidate,
            from: socket.user._id
          });
        }
      });
    });

    socket.on('call-end', (data) => {
      console.log('📞 Call end from user:', socket.user._id, 'for call:', data.callId);

      // Notify all participants that the call has ended
      data.participants?.forEach(participantId => {
        socket.to(`user-${participantId}`).emit('call-end', {
          callId: data.callId,
          endedBy: socket.user._id
        });
      });
    });

    socket.on('add-participant', (data) => {
      console.log('👥 Add participant request from user:', socket.user._id, 'adding:', data.participantId);

      // Notify the new participant to join the call
      socket.to(`user-${data.participantId}`).emit('call-offer', {
        callId: data.callId,
        callerId: socket.user._id,
        callerName: socket.user.name || 'Unknown',
        participants: data.participants,
        type: data.type,
        isRejoin: true
      });

      // Notify existing participants about the new participant
      data.participants?.forEach(participantId => {
        if (participantId !== socket.user._id && participantId !== data.participantId) {
          socket.to(`user-${participantId}`).emit('participant-joined', {
            callId: data.callId,
            participant: {
              userId: data.participantId,
              name: 'New Participant'
            }
          });
        }
      });
    });

    // Join user-specific room for calls and notifications
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${socket.user?._id} joined user room ${userId}`);
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      const { groupId } = data;
      if (!groupId) return;

      if (!typingUsers.has(groupId)) {
        typingUsers.set(groupId, new Set());
      }

      const groupTyping = typingUsers.get(groupId);
      groupTyping.add(socket.user._id);

      // Broadcast typing start to other group members
      socket.to(groupId).emit('user-typing-start', {
        groupId,
        user: {
          _id: socket.user._id,
          name: socket.user.name
        }
      });
    });

    socket.on('typing-stop', (data) => {
      const { groupId } = data;
      if (!groupId) return;

      const groupTyping = typingUsers.get(groupId);
      if (groupTyping) {
        groupTyping.delete(socket.user._id);

        // Broadcast typing stop to other group members
        socket.to(groupId).emit('user-typing-stop', {
          groupId,
          user: {
            _id: socket.user._id,
            name: socket.user.name
          }
        });
      }
    });
  });

  return io;
};

module.exports = configureSocket;