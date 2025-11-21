const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const configureSocket = (server) => {
  console.log('🔌 Creating Socket.io instance...');
  const io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'exp://localhost:8081',
        'http://localhost:8081',
        'http://10.136.43.172:8081',  // Add the actual IP address
        process.env.FRONTEND_URL
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  });

  console.log('✅ Socket.io instance created');

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.log('❌ No auth token provided for socket connection');
        return next(new Error('Authentication error: No token provided'));
      }

      console.log('🔐 Verifying socket token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        console.log('❌ Invalid user or user not active for socket:', decoded.userId);
        return next(new Error('Authentication error: Invalid token or user'));
      }

      // Attach user info to socket
      socket.userId = user._id;
      socket.user = user;
      console.log('✅ Socket auth successful for user:', user._id);
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // Basic connection handling
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id, 'User:', socket.userId);

    // Handle group joining
    socket.on('joinGroup', (data) => {
      try {
        const { groupId } = data;
        if (!groupId) {
          console.log('❌ joinGroup: No groupId provided');
          return;
        }

        console.log(`👥 User ${socket.userId} joining group ${groupId}`);
        socket.join(groupId);
        console.log(`✅ User ${socket.userId} successfully joined group ${groupId}`);
      } catch (error) {
        console.error('❌ Error joining group:', error);
      }
    });

    // Handle group leaving
    socket.on('leaveGroup', (data) => {
      try {
        const { groupId } = data;
        if (!groupId) {
          console.log('❌ leaveGroup: No groupId provided');
          return;
        }

        console.log(`👥 User ${socket.userId} leaving group ${groupId}`);
        socket.leave(groupId);
        console.log(`✅ User ${socket.userId} successfully left group ${groupId}`);
      } catch (error) {
        console.error('❌ Error leaving group:', error);
      }
    });

    // Handle user room joining (for private messages)
    socket.on('joinUserRoom', (data) => {
      try {
        const { userId } = data;
        if (!userId) {
          console.log('❌ joinUserRoom: No userId provided');
          return;
        }

        console.log(`👤 User ${socket.userId} joining user room ${userId}`);
        socket.join(`user_${userId}`);
        console.log(`✅ User ${socket.userId} successfully joined user room ${userId}`);
      } catch (error) {
        console.error('❌ Error joining user room:', error);
      }
    });

    // Handle user room leaving
    socket.on('leaveUserRoom', (data) => {
      try {
        const { userId } = data;
        if (!userId) {
          console.log('❌ leaveUserRoom: No userId provided');
          return;
        }

        console.log(`👤 User ${socket.userId} leaving user room ${userId}`);
        socket.leave(`user_${userId}`);
        console.log(`✅ User ${socket.userId} successfully left user room ${userId}`);
      } catch (error) {
        console.error('❌ Error leaving user room:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id, 'User:', socket.userId);
    });

    // ===== CALL EVENT HANDLERS =====

    // Voice call offer
    socket.on('callOffer', (data) => {
      try {
        const { offer, targetUserId, groupId } = data;
        console.log(`📞 Voice call offer from ${socket.userId} to ${targetUserId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members except sender
          socket.to(groupId).emit('callOffer', {
            offer,
            fromUserId: socket.userId,
            groupId
          });
        } else {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('callOffer', {
            offer,
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling call offer:', error);
      }
    });

    // Voice call answer
    socket.on('callAnswer', (data) => {
      try {
        const { answer, targetUserId, groupId } = data;
        console.log(`📞 Voice call answer from ${socket.userId} to ${targetUserId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members except sender
          socket.to(groupId).emit('callAnswer', {
            answer,
            fromUserId: socket.userId,
            groupId
          });
        } else {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('callAnswer', {
            answer,
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling call answer:', error);
      }
    });

    // Voice call ICE candidate
    socket.on('iceCandidate', (data) => {
      try {
        const { candidate, targetUserId, groupId } = data;
        console.log(`🧊 Voice call ICE candidate from ${socket.userId} to ${targetUserId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members except sender
          socket.to(groupId).emit('iceCandidate', {
            candidate,
            fromUserId: socket.userId,
            groupId
          });
        } else {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('iceCandidate', {
            candidate,
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling ICE candidate:', error);
      }
    });

    // Voice call end
    socket.on('callEnd', (data) => {
      try {
        const { targetUserId, groupId } = data;
        console.log(`📞 Voice call end from ${socket.userId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members
          socket.to(groupId).emit('callEnd', {
            fromUserId: socket.userId,
            groupId
          });
        } else if (targetUserId) {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('callEnd', {
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling call end:', error);
      }
    });

    // Video call offer
    socket.on('videoCallOffer', (data) => {
      try {
        const { offer, targetUserId, groupId } = data;
        console.log(`📹 Video call offer from ${socket.userId} to ${targetUserId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members except sender
          socket.to(groupId).emit('videoCallOffer', {
            offer,
            fromUserId: socket.userId,
            groupId
          });
        } else {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('videoCallOffer', {
            offer,
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling video call offer:', error);
      }
    });

    // Video call answer
    socket.on('videoCallAnswer', (data) => {
      try {
        const { answer, targetUserId, groupId } = data;
        console.log(`📹 Video call answer from ${socket.userId} to ${targetUserId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members except sender
          socket.to(groupId).emit('videoCallAnswer', {
            answer,
            fromUserId: socket.userId,
            groupId
          });
        } else {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('videoCallAnswer', {
            answer,
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling video call answer:', error);
      }
    });

    // Video call ICE candidate
    socket.on('videoIceCandidate', (data) => {
      try {
        const { candidate, targetUserId, groupId } = data;
        console.log(`🧊 Video call ICE candidate from ${socket.userId} to ${targetUserId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members except sender
          socket.to(groupId).emit('videoIceCandidate', {
            candidate,
            fromUserId: socket.userId,
            groupId
          });
        } else {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('videoIceCandidate', {
            candidate,
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling video ICE candidate:', error);
      }
    });

    // Video call end
    socket.on('videoCallEnd', (data) => {
      try {
        const { targetUserId, groupId } = data;
        console.log(`📹 Video call end from ${socket.userId}${groupId ? ` in group ${groupId}` : ''}`);

        if (groupId) {
          // Group call - broadcast to all group members
          socket.to(groupId).emit('videoCallEnd', {
            fromUserId: socket.userId,
            groupId
          });
        } else if (targetUserId) {
          // Direct call - send to target user
          socket.to(`user_${targetUserId}`).emit('videoCallEnd', {
            fromUserId: socket.userId
          });
        }
      } catch (error) {
        console.error('❌ Error handling video call end:', error);
      }
    });

    // Add participant to call
    socket.on('addParticipant', (data) => {
      try {
        const { callId, participantId } = data;
        console.log(`👥 Adding participant ${participantId} to call ${callId} by ${socket.userId}`);

        // Notify the new participant
        socket.to(`user_${participantId}`).emit('participantJoined', {
          participant: { userId: participantId },
          callId
        });

        // Notify others in the call about the new participant
        socket.broadcast.emit('participantJoined', {
          participant: { userId: participantId },
          callId
        });
      } catch (error) {
        console.error('❌ Error adding participant:', error);
      }
    });
  });

  console.log('✅ Socket.io configured with authentication');
  return io;
};

module.exports = configureSocket;