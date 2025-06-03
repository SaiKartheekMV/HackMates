const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Profile = require('../models/Profile');
const emailService = require('../services/emailService');
const cacheService = require('../services/cacheService');
const { createSuccessResponse, createErrorResponse } = require('../utils/helpers');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createErrorResponse('Validation failed', errors.array()));
    }

    const { firstName, lastName, email, password, termsAccepted, privacyPolicyAccepted } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json(createErrorResponse('User already exists with this email'));
    }

    // Validate terms and privacy policy acceptance
    if (!termsAccepted || !privacyPolicyAccepted) {
      return res.status(400).json(createErrorResponse('You must accept the terms of service and privacy policy'));
    }

    // Create user
    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      termsAccepted,
      privacyPolicyAccepted
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Create empty profile
    const profile = new Profile({
      userId: user._id,
      bio: '',
      skills: { technical: [], soft: [], languages: [] },
      experience: [],
      education: [],
      projects: [],
      hackathons: [],
      certifications: [],
      completionScore: 10 // Base score for having an account
    });
    await profile.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Cache user session
    await cacheService.cacheUserSession(user._id.toString(), {
      userId: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    });

    res.status(201).json(createSuccessResponse('User registered successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture
      },
      tokens: {
        accessToken,
        refreshToken
      },
      message: 'Please check your email to verify your account'
    }));

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Registration failed. Please try again.'));
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createErrorResponse('Validation failed', errors.array()));
    }

    const { email, password, rememberMe } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid email or password'));
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json(createErrorResponse('Account temporarily locked due to too many failed login attempts. Please try again later.'));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.loginAttempts += 1;
      user.lastFailedLogin = new Date();
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5 && !user.lockUntil) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }
      
      await user.save();
      return res.status(401).json(createErrorResponse('Invalid email or password'));
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.lastFailedLogin = undefined;
    }

    // Update last login
    user.lastLogin = new Date();
    user.lastActive = new Date();

    // Generate JWT tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Cache user session
    await cacheService.cacheUserSession(user._id.toString(), {
      userId: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    });

    // Set secure HTTP-only cookie for refresh token if remember me is checked
    if (rememberMe) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    res.json(createSuccessResponse('Login successful', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        role: user.role,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken: rememberMe ? undefined : refreshToken // Don't send in response if using cookie
      }
    }));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Login failed. Please try again.'));
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: bodyRefreshToken } = req.body;
    const cookieRefreshToken = req.cookies?.refreshToken;
    
    const refreshToken = bodyRefreshToken || cookieRefreshToken;

    if (!refreshToken) {
      return res.status(401).json(createErrorResponse('Refresh token required'));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and validate refresh token
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json(createErrorResponse('Invalid refresh token'));
    }

    // Generate new tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    user.lastActive = new Date();
    await user.save();

    // Update cached session
    await cacheService.cacheUserSession(user._id.toString(), {
      userId: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    });

    // Update cookie if it was used
    if (cookieRefreshToken) {
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    res.json(createSuccessResponse('Token refreshed successfully', {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: cookieRefreshToken ? undefined : newRefreshToken
      }
    }));

  } catch (error) {
    console.error('Token refresh error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json(createErrorResponse('Invalid refresh token'));
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json(createErrorResponse('Refresh token expired'));
    }
    res.status(500).json(createErrorResponse('Token refresh failed'));
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const userId = req.user._id;

    // Clear refresh token from database
    await User.findByIdAndUpdate(userId, { 
      refreshToken: null,
      lastActive: new Date()
    });

    // Clear cached session
    await cacheService.clearUserSession(userId.toString());

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json(createSuccessResponse('Logged out successfully'));

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(createErrorResponse('Logout failed'));
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createErrorResponse('Validation failed', errors.array()));
    }

    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json(createSuccessResponse('If an account with that email exists, a password reset link has been sent.'));
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
      res.json(createSuccessResponse('Password reset link has been sent to your email.'));
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      res.status(500).json(createErrorResponse('Failed to send password reset email. Please try again.'));
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json(createErrorResponse('Password reset request failed'));
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createErrorResponse('Validation failed', errors.array()));
    }

    const { token, password } = req.body;

    // Hash the token from URL to match stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by token and check if not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(createErrorResponse('Invalid or expired password reset token'));
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    
    // Clear all refresh tokens to force re-login
    user.refreshToken = null;
    
    await user.save();

    // Clear cached sessions
    await cacheService.clearUserSession(user._id.toString());

    // Send password change confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send password change confirmation:', emailError);
    }

    res.json(createSuccessResponse('Password has been reset successfully. Please login with your new password.'));

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json(createErrorResponse('Password reset failed'));
  }
};

/**
 * @desc    Verify email address
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json(createErrorResponse('Email verification token is required'));
    }

    // Hash the token to match stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(createErrorResponse('Invalid or expired email verification token'));
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerifiedAt = new Date();
    
    await user.save();

    // Update cached session
    await cacheService.cacheUserSession(user._id.toString(), {
      userId: user._id,
      email: user.email,
      isEmailVerified: true
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json(createSuccessResponse('Email verified successfully! Welcome to HackMates.', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    }));

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json(createErrorResponse('Email verification failed'));
  }
};

/**
 * @desc    Resend email verification
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendEmailVerification = async (req, res) => {
  try {
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json(createErrorResponse('Email is already verified'));
    }

    // Check if user recently requested verification (rate limiting)
    const timeSinceLastRequest = Date.now() - (user.emailVerificationExpires - 24 * 60 * 60 * 1000);
    if (timeSinceLastRequest < 5 * 60 * 1000) { // 5 minutes
      return res.status(429).json(createErrorResponse('Please wait 5 minutes before requesting another verification email'));
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
      res.json(createSuccessResponse('Verification email has been sent to your email address.'));
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      res.status(500).json(createErrorResponse('Failed to send verification email. Please try again.'));
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json(createErrorResponse('Failed to resend verification email'));
  }
};

/**
 * @desc    Change password (authenticated user)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createErrorResponse('Validation failed', errors.array()));
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json(createErrorResponse('User not found'));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(createErrorResponse('Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    
    // Clear all refresh tokens to force re-login on other devices
    user.refreshToken = null;
    
    await user.save();

    // Clear cached sessions
    await cacheService.clearUserSession(userId.toString());

    // Send password change confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send password change confirmation:', emailError);
    }

    res.json(createSuccessResponse('Password changed successfully. Please login again.'));

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(createErrorResponse('Password change failed'));
  }
};

/**
 * @desc    Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user profile
    const profile = await Profile.findOne({ userId: user._id });

    res.json(createSuccessResponse('User data retrieved successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        role: user.role,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      profile: profile ? {
        completionScore: profile.completionScore,
        bio: profile.bio,
        skills: profile.skills,
        location: profile.location
      } : null
    }));

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve user data'));
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword, 
  verifyEmail,
  resendEmailVerification,
  changePassword,
  getCurrentUser
};