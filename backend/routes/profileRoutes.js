// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  uploadResume,
  scrapeLinkedIn
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
});

// Protected routes
router.use(protect);

router.route('/')
  .get(getProfile)
  .post(createProfile)
  .put(updateProfile)
  .delete(deleteProfile);

router.get('/all', getAllProfiles);
router.post('/upload-resume', upload.single('resume'), uploadResume);
router.post('/scrape-linkedin', scrapeLinkedIn);

module.exports = router;