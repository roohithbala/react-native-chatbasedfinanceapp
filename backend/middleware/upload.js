const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different media types
const mediaTypes = ['images', 'videos', 'audio', 'documents'];
mediaTypes.forEach(type => {
  const typeDir = path.join(uploadsDir, type);
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ]
  };

  // Determine media type from field name
  let mediaType = 'document'; // default
  if (file.fieldname.includes('image')) mediaType = 'image';
  else if (file.fieldname.includes('video')) mediaType = 'video';
  else if (file.fieldname.includes('audio')) mediaType = 'audio';

  if (allowedTypes[mediaType].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${mediaType}. Allowed types: ${allowedTypes[mediaType].join(', ')}`), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;

    // Determine destination based on field name
    if (file.fieldname.includes('image')) {
      uploadPath = path.join(uploadsDir, 'images');
    } else if (file.fieldname.includes('video')) {
      uploadPath = path.join(uploadsDir, 'videos');
    } else if (file.fieldname.includes('audio')) {
      uploadPath = path.join(uploadsDir, 'audio');
    } else {
      uploadPath = path.join(uploadsDir, 'documents');
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

// File size limits (in bytes)
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB for general files
  files: 1 // Only one file per request
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// Specific upload middlewares for different media types
const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 } // 10MB for images
}).single('image');

const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 } // 100MB for videos
}).single('video');

const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 } // 50MB for audio
}).single('audio');

const uploadDocument = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 } // 25MB for documents
}).single('document');

const uploadGeneral = upload.single('file');

module.exports = {
  upload,
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadDocument,
  uploadGeneral,
  uploadsDir
};