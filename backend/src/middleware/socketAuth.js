// src/middleware/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.io authentication middleware
 * Verifies JWT token from socket handshake and attaches user to socket
 */
const socketAuth = async (socket, next) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth?.token || 
                  socket.handshake.query?.token ||
                  socket.request.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database (excluding sensitive data)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    if (!user.isEmailVerified) {
      return next(new Error('Email not verified'));
    }

    // Attach user to socket for use in event handlers
    socket.user = user;
    socket.userId = user._id.toString();
    
    console.log(`User ${user.email} connected via socket ${socket.id}`);
    next();
    
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      next(new Error('Invalid authentication token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new Error('Authentication token expired'));
    } else {
      next(new Error('Authentication failed'));
    }
  }
};

module.exports = socketAuth;