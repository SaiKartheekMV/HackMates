// src/routes/profiles.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
  }
});

// Custom middleware to upload to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Create a readable stream from buffer
    const stream = Readable.from(req.file.buffer);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
          public_id: `${req.user._id}_${Date.now()}`,
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      stream.pipe(uploadStream);
    });

    // Add Cloudinary result to req object
    req.file.path = result.secure_url;
    req.file.filename = result.public_id;
    
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

// Protected routes - require authentication
router.use(authenticateToken);

// Personal profile routes
router.get('/me', profileController.getMyProfile);
router.put('/me', validateProfileUpdate, profileController.updateMyProfile);
router.post('/me/upload-resume', upload.single('resume'), handleMulterError, uploadToCloudinary, profileController.uploadResume);
router.post('/me/calculate-completion', profileController.calculateCompletion);

// Search profiles route - must come before the dynamic :userId route
router.get('/search', profileController.searchProfiles);

// Public profile route (should be last to avoid conflicts with other routes)
router.get('/:userId', profileController.getPublicProfile);

module.exports = router;