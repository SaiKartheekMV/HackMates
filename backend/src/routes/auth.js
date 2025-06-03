const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  authLimiter,
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2-30 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2-30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  authLimiter,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  authLimiter,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], resetPassword);

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', [
  authLimiter,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], resendVerification);

module.exports = router;