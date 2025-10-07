const express = require('express');
const auth = require('../middleware/auth');
const { uploadImage, uploadVideo, uploadAudio, uploadDocument } = require('../middleware/upload');
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper function to get default text for media messages
function getDefaultMediaText(mediaType) {
  switch (mediaType) {
    case 'image':
      return '📷 Image';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🎵 Audio';
    case 'document':
      return '📄 Document';
    default:
      return '📎 File';
  }
}

// Upload image
router.post('/image/:groupId', auth, (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleMediaUpload(req, res, 'image');
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process image upload'
      });
    }
  });
});

// Upload video
router.post('/video/:groupId', auth, (req, res) => {
  uploadVideo(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleMediaUpload(req, res, 'video');
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process video upload'
      });
    }
  });
});

// Upload audio
router.post('/audio/:groupId', auth, (req, res) => {
  uploadAudio(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleMediaUpload(req, res, 'audio');
    } catch (error) {
      console.error('Audio upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process audio upload'
      });
    }
  });
});

// Upload image to direct message
router.post('/image/direct/:userId', auth, (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleDirectMediaUpload(req, res, 'image');
    } catch (error) {
      console.error('Direct image upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process image upload'
      });
    }
  });
});

// Upload video to direct message
router.post('/video/direct/:userId', auth, (req, res) => {
  uploadVideo(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleDirectMediaUpload(req, res, 'video');
    } catch (error) {
      console.error('Direct video upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process video upload'
      });
    }
  });
});

// Upload audio to direct message
router.post('/audio/direct/:userId', auth, (req, res) => {
  uploadAudio(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleDirectMediaUpload(req, res, 'audio');
    } catch (error) {
      console.error('Direct audio upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process audio upload'
      });
    }
  });
});

// Upload document to direct message
router.post('/document/direct/:userId', auth, (req, res) => {
  uploadDocument(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      await handleDirectMediaUpload(req, res, 'document');
    } catch (error) {
      console.error('Direct document upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process document upload'
      });
    }
  });
});

// Helper function to handle direct media upload and message creation
async function handleDirectMediaUpload(req, res, mediaType) {
  const { userId: recipientId } = req.params;
  const senderId = req.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  // Validate that recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return res.status(404).json({
      status: 'error',
      message: 'Recipient not found'
    });
  }

  // Get sender info
  const sender = await User.findById(senderId).select('name avatar username');
  if (!sender) {
    return res.status(404).json({
      status: 'error',
      message: 'Sender not found'
    });
  }

  // Create media URL (relative path for serving)
  const mediaUrl = `/uploads/files/${mediaType === 'audio' ? 'audio' : mediaType + 's'}/${file.filename}`;

  // Get file metadata
  const stats = fs.statSync(file.path);
  const fileSize = stats.size;

  // Create direct message data
  const messageData = {
    text: req.body.caption || getDefaultMediaText(mediaType), // Optional caption with fallback
    sender: {
      _id: sender._id,
      name: sender.name,
      username: sender.username,
      avatar: sender.avatar
    },
    receiver: recipientId,
    type: mediaType,
    status: 'sent',
    mediaUrl,
    mediaType,
    mediaSize: fileSize,
    fileName: file.originalname,
    mimeType: file.mimetype,
    readBy: [{
      userId: senderId,
      readAt: new Date()
    }]
  };

  // Add media-specific metadata
  if (mediaType === 'image' || mediaType === 'video') {
    messageData.mediaWidth = req.body.width || null;
    messageData.mediaHeight = req.body.height || null;
  }

  if (mediaType === 'video' || mediaType === 'audio') {
    messageData.mediaDuration = req.body.duration || null;
  }

  // Create and save direct message
  const DirectMessage = require('../models/DirectMessage');
  const message = new DirectMessage(messageData);
  await message.save();

  // Emit socket event for real-time updates
  if (req.io) {
    const socketMessage = {
      _id: message._id.toString(),
      text: message.text,
      sender: message.sender,
      recipient: message.receiver.toString(),
      type: message.type,
      status: message.status,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      mediaSize: message.mediaSize,
      fileName: message.fileName,
      mimeType: message.mimeType,
      createdAt: message.createdAt.toISOString(),
      readBy: message.readBy
    };

    // Emit to both sender and recipient
    req.io.to(`user_${recipientId}`).emit('receive-direct-message', socketMessage);
    req.io.to(`user_${senderId}`).emit('receive-direct-message', socketMessage);
  }

  res.status(201).json({
    status: 'success',
    data: {
      message: message,
      fileUrl: mediaUrl
    }
  });
}

// Helper function to handle media upload and message creation
async function handleMediaUpload(req, res, mediaType) {
  const { groupId } = req.params;
  const userId = req.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  // Validate group membership
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({
      status: 'error',
      message: 'Group not found'
    });
  }

  const isMember = group.members.some(member =>
    member.userId.toString() === userId.toString()
  );
  if (!isMember) {
    return res.status(403).json({
      status: 'error',
      message: 'User is not a member of this group'
    });
  }

  // Get user info
  const user = await User.findById(userId).select('name avatar username');
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  // Create media URL (relative path for serving)
  const mediaUrl = `/uploads/files/${mediaType === 'audio' ? 'audio' : mediaType + 's'}/${file.filename}`;

  // Get file metadata
  const stats = fs.statSync(file.path);
  const fileSize = stats.size;

  // Create message data
  const messageData = {
    text: req.body.caption || getDefaultMediaText(mediaType), // Optional caption with fallback
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    },
    groupId,
    type: mediaType,
    status: 'sent',
    mediaUrl,
    mediaType,
    mediaSize: fileSize,
    fileName: file.originalname,
    mimeType: file.mimetype,
    readBy: [{
      userId: userId,
      readAt: new Date()
    }]
  };

  // Add media-specific metadata
  if (mediaType === 'image' || mediaType === 'video') {
    // For images/videos, you might want to extract dimensions later
    // For now, we'll set basic metadata
    messageData.mediaWidth = req.body.width || null;
    messageData.mediaHeight = req.body.height || null;
  }

  if (mediaType === 'video' || mediaType === 'audio') {
    // Duration would be extracted from the file metadata
    messageData.mediaDuration = req.body.duration || null;
  }

  // Create and save message
  const message = new Message(messageData);
  await message.save();

  // Emit socket event for real-time updates
  if (req.io) {
    const socketMessage = {
      _id: message._id.toString(),
      text: message.text,
      user: message.user,
      groupId: message.groupId.toString(),
      type: message.type,
      status: message.status,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      mediaSize: message.mediaSize,
      fileName: message.fileName,
      mimeType: message.mimeType,
      createdAt: message.createdAt.toISOString(),
      readBy: message.readBy
    };

    req.io.to(groupId).emit('receive-message', socketMessage);
  }

  res.status(201).json({
    status: 'success',
    data: {
      message: message,
      fileUrl: mediaUrl
    }
  });
}

// Serve uploaded files (new format with /files/)
router.get('/files/*', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params[0]);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found'
    });
  }

  // Set appropriate headers based on file type
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.zip': 'application/zip'
  };

  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);

  // For large files, stream them
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (error) => {
    console.error('File streaming error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error streaming file'
    });
  });
});

// Serve uploaded files (legacy format without /files/ for backward compatibility)
router.get('/*', (req, res) => {
  // Skip if this is a /files/ request (handled above)
  if (req.path.startsWith('/files/')) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found'
    });
  }

  const filePath = path.join(__dirname, '../uploads', req.params[0]);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found'
    });
  }

  // Set appropriate headers based on file type
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.zip': 'application/zip'
  };

  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);

  // For large files, stream them
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (error) => {
    console.error('File streaming error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error streaming file'
    });
  });
});

module.exports = router;