const { createErrorResponse } = require('../utils/helpers');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    return res.status(400).json(createErrorResponse(message));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists`;
    return res.status(409).json(createErrorResponse(message));
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    return res.status(400).json(createErrorResponse('Validation Error', errors));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(createErrorResponse('Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(createErrorResponse('Token expired'));
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json(createErrorResponse('File too large. Maximum size is 10MB.'));
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json(createErrorResponse('Too many files. Maximum is 5 files.'));
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json(createErrorResponse('Unexpected field in file upload.'));
  }

  // MongoDB connection errors
  if (err.name === 'MongooseServerSelectionError') {
    return res.status(503).json(createErrorResponse('Database connection failed. Please try again later.'));
  }

  if (err.name === 'MongoNetworkError') {
    return res.status(503).json(createErrorResponse('Database network error. Please try again later.'));
  }

  // Redis connection errors
  if (err.code === 'ECONNREFUSED' && err.port === 6379) {
    console.error('Redis connection failed');
    // Don't expose Redis errors to client, continue without cache
  }

  // Rate limiting errors
  if (err.name === 'TooManyRequestsError') {
    return res.status(429).json(createErrorResponse('Too many requests. Please try again later.'));
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json(createErrorResponse('Cross-origin request blocked'));
  }

  // File type errors
  if (err.message && err.message.includes('file type')) {
    return res.status(400).json(createErrorResponse('Invalid file type. Please upload a supported file format.'));
  }

  // External API errors
  if (err.name === 'AxiosError' || err.isAxiosError) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'External service error';
    
    // Don't expose internal API errors
    if (status >= 500) {
      return res.status(503).json(createErrorResponse('External service temporarily unavailable'));
    }
    
    return res.status(status).json(createErrorResponse(message));
  }

  // AI Service specific errors
  if (err.message && err.message.includes('AI service')) {
    return res.status(503).json(createErrorResponse('AI service temporarily unavailable. Please try again later.'));
  }

  // Email service errors
  if (err.message && err.message.includes('email')) {
    return res.status(503).json(createErrorResponse('Email service temporarily unavailable. Please try again later.'));
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json(createErrorResponse(err.message, err.data));
  }

  // PayloadTooLargeError
  if (err.type === 'entity.too.large') {
    return res.status(413).json(createErrorResponse('Request payload too large'));
  }

  // SyntaxError (invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(createErrorResponse('Invalid JSON in request body'));
  }

  // Default server error
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong. Please try again later.'
    : error.message || 'Internal Server Error';

  res.status(statusCode).json(createErrorResponse(message, 
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  ));
};

/**
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  res.status(404).json(createErrorResponse(message));
};

/**
 * Async error wrapper to avoid try-catch in every controller
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create standardized error responses for different scenarios
 */
const createAppError = {
  badRequest: (message = 'Bad Request', data = null) => 
    new AppError(message, 400, data),
    
  unauthorized: (message = 'Unauthorized') => 
    new AppError(message, 401),
    
  forbidden: (message = 'Access Denied') => 
    new AppError(message, 403),
    
  notFound: (resource = 'Resource') => 
    new AppError(`${resource} not found`, 404),
    
  conflict: (message = 'Resource already exists') => 
    new AppError(message, 409),
    
  validationError: (message = 'Validation Error', errors = []) => 
    new AppError(message, 422, errors),
    
  tooManyRequests: (message = 'Too many requests') => 
    new AppError(message, 429),
    
  internalServer: (message = 'Internal Server Error') => 
    new AppError(message, 500),
    
  serviceUnavailable: (service = 'Service') => 
    new AppError(`${service} temporarily unavailable`, 503)
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  createAppError
};