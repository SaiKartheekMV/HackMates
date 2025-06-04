// src/utils/helpers.js
// ==============================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Match result
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate profile completion score
 * @param {Object} profile - User profile object
 * @returns {number} - Completion percentage
 */
const calculateCompletionScore = (profile) => {
  const fields = [
    'bio',
    'skills',
    'experience',
    'education',
    'projects',
    'socialLinks.github',
    'socialLinks.portfolio',
    'location.city',
    'resumeUrl'
  ];

  let completedFields = 0;
  
  fields.forEach(field => {
    const value = getNestedProperty(profile, field);
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      completedFields++;
    }
  });

  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Get nested object property
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @returns {any} - Property value
 */
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Sanitize user input
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate time difference
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} - Time difference
 */
const getTimeDifference = (startDate, endDate = new Date()) => {
  const diffInSeconds = Math.floor((endDate - startDate) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(startDate);
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination info
 */
const getPaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

/**
 * Create success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Formatted response
 */
const createSuccessResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta
  };
};

/**
 * Create error response
 * @param {string} message - Error message
 * @param {number} code - Error code
 * @param {any} details - Error details
 * @returns {Object} - Formatted error response
 */
const createErrorResponse = (message, code = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      details
    }
  };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - Validation result
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Calculate similarity between two arrays
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {number} - Similarity score (0-1)
 */
const calculateArraySimilarity = (arr1, arr2) => {
  if (!arr1.length || !arr2.length) return 0;
  
  const set1 = new Set(arr1.map(item => item.toLowerCase()));
  const set2 = new Set(arr2.map(item => item.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

/**
 * Sleep function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  calculateCompletionScore,
  getNestedProperty,
  sanitizeInput,
  formatDate,
  getTimeDifference,
  getPaginationInfo,
  createSuccessResponse,
  createErrorResponse,
  isValidObjectId,
  calculateArraySimilarity,
  sleep
};