const express = require('express');
const { body } = require('express-validator');
const {
  getCurrentUser,
  updateUser,
  deleteUser,
  uploadProfilePicture,
  changePassword,
  getUserById,
  searchUsers
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, getCurrentUser);

// @route   PUT /api/users/me
// @desc    Update current user
// @access  Private
router.put('/me', [
  authenticate,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2-30 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2-30 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], updateUser);

// @route   DELETE /api/users/me
// @desc    Delete current user account
// @access  Private
router.delete('/me', authenticate, deleteUser);

// @route   POST /api/users/upload-avatar
// @desc    Upload profile picture
// @access  Private
router.post('/upload-avatar', [
  authenticate,
  uploadLimiter,
  upload.single('avatar')
], uploadProfilePicture);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', [
  authenticate,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], changePassword);

// @route   GET /api/users/:id
// @desc    Get user by ID (public profile)
// @access  Public
router.get('/:id', getUserById);

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', authenticate, searchUsers);

module.exports = router;