const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cacheService = require('../services/cacheService');
const { createErrorResponse } = require('../utils/helpers');

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json(createErrorResponse('Token expired'));
    }

    // Try to get user from cache first
    let cachedUser = await cacheService.getCachedUserSession(decoded.userId);
    
    if (cachedUser) {
      // If user exists in cache, get full user data
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      if (!user) {
        await cacheService.clearUserSession(decoded.userId);
        return res.status(401).json(createErrorResponse('User not found'));
      }
      req.user = user;
    } else {
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      if (!user) {
        return res.status(401).json(createErrorResponse('User not found'));
      }

      // Cache the user session
      await cacheService.cacheUserSession(user._id.toString(), {
        userId: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      });

      req.user = user;
    }

    // Update last active timestamp
    req.user.lastActive = new Date();
    await req.user.save({ validateBeforeSave: false });

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json(createErrorResponse('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(createErrorResponse('Token expired'));
    }
    
    return res.status(500).json(createErrorResponse('Authentication failed'));
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.exp < Date.now() / 1000) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    req.user = user || null;

    if (user) {
      user.lastActive = new Date();
      await user.save({ validateBeforeSave: false });
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Require email verification
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createErrorResponse('Authentication required'));
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json(createErrorResponse('Email verification required', {
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address to access this feature'
    }));
  }

  next();
};

/**
 * Authorize user roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('Access denied. Insufficient permissions.'));
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin
 */
const authorizeOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
      return next();
    }

    return res.status(403).json(createErrorResponse('Access denied. You can only access your own resources.'));
  };
};

/**
 * Check if user owns the resource (strict ownership check)
 */
const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    if (req.user._id.toString() !== resourceUserId) {
      return res.status(403).json(createErrorResponse('Access denied. You can only access your own resources.'));
    }

    next();
  };
};

/**
 * Rate limit per user
 */
const userRateLimit = (requests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (userRequests.has(userId)) {
      const userRequestList = userRequests.get(userId);
      const validRequests = userRequestList.filter(timestamp => timestamp > windowStart);
      userRequests.set(userId, validRequests);
    }

    // Check current request count
    const currentRequests = userRequests.get(userId) || [];
    
    if (currentRequests.length >= requests) {
      return res.status(429).json(createErrorResponse('Too many requests. Please try again later.'));
    }

    // Add current request
    currentRequests.push(now);
    userRequests.set(userId, currentRequests);

    next();
  };
};

/**
 * Check if user account is active
 */
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createErrorResponse('Authentication required'));
  }

  if (req.user.status === 'suspended') {
    return res.status(403).json(createErrorResponse('Account suspended. Please contact support.'));
  }

  if (req.user.status === 'inactive') {
    return res.status(403).json(createErrorResponse('Account inactive. Please activate your account.'));
  }

  next();
};

/**
 * Validate API key for external services
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json(createErrorResponse('API key required'));
  }

  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json(createErrorResponse('Invalid API key'));
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireEmailVerification,
  authorizeRoles,
  authorizeOwnerOrAdmin,
  requireOwnership,
  userRateLimit,
  requireActiveAccount,
  validateApiKey
};