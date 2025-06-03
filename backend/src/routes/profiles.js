const express = require('express');
const { body } = require('express-validator');
const {
  getMyProfile,
  updateProfile,
  uploadResume,
  importLinkedInData,
  getPublicProfile,
  deleteProfile
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/profiles/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authenticate, getMyProfile);

// @route   PUT /api/profiles/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', [
  authenticate,
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('skills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Skills must be an array with maximum 20 items'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each skill must be between 1-30 characters'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2-50 characters'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2-50 characters'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),
  body('socialLinks.portfolio')
    .optional()
    .isURL()
    .withMessage('Portfolio URL must be valid'),
  body('experience')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Experience must be an array with maximum 10 items'),
  body('experience.*.title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2-100 characters'),
  body('experience.*.company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2-100 characters'),
  body('experience.*.duration')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Duration must be between 3-50 characters'),
  body('education')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Education must be an array with maximum 5 items'),
  body('education.*.degree')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Degree must be between 2-100 characters'),
  body('education.*.institution')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution name must be between 2-100 characters'),
  body('education.*.year')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage('Year must be between 1950 and 10 years from now'),
  body('projects')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Projects must be an array with maximum 10 items'),
  body('projects.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2-100 characters'),
  body('projects.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Project description cannot exceed 500 characters'),
  body('projects.*.technologies')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Technologies must be an array with maximum 10 items'),
  body('projects.*.githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  body('projects.*.liveUrl')
    .optional()
    .isURL()
    .withMessage('Live URL must be valid')
], updateProfile);

// @route   POST /api/profiles/upload-resume
// @desc    Upload and parse resume
// @access  Private
router.post('/upload-resume', [
  authenticate,
  uploadLimiter,
  upload.single('resume')
], uploadResume);

// @route   POST /api/profiles/import-linkedin
// @desc    Import LinkedIn data
// @access  Private
router.post('/import-linkedin', [
  authenticate,
  body('linkedinUrl')
    .isURL()
    .withMessage('LinkedIn URL must be valid')
    .matches(/linkedin\.com\/in\//)
    .withMessage('Must be a valid LinkedIn profile URL')
], importLinkedInData);

// @route   GET /api/profiles/:userId
// @desc    Get public profile by user ID
// @access  Public
router.get('/:userId', getPublicProfile);

// @route   DELETE /api/profiles/me
// @desc    Delete current user's profile
// @access  Private
router.delete('/me', authenticate, deleteProfile);

module.exports = router;