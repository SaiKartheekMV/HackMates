// src/middleware/validation.js
const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User update validation
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1-50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1-50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be boolean'),
  
  body('preferences.visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either public or private'),
  
  handleValidationErrors
];

// Profile validation
const validateProfileUpdate = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1-50 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1-100 characters'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1-100 characters'),
  
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
  
  handleValidationErrors
];

// Authentication validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1-50 characters'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Team validation
const validateTeamCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Team name is required and must be between 1-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  
  body('maxMembers')
    .isInt({ min: 1, max: 10 })
    .withMessage('Max members must be between 1-10'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be boolean'),
  
  handleValidationErrors
];

// Request validation
const validateSendRequest = [
  body('toUserId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  
  body('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  
  body('teamId')
    .optional()
    .isMongoId()
    .withMessage('Team ID must be valid if provided'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Message cannot exceed 300 characters'),
  
  body('type')
    .isIn(['teammate', 'team_invite'])
    .withMessage('Type must be either teammate or team_invite'),
  
  handleValidationErrors
];

// Hackathon validation (MISSING - this is likely what's causing the error)
const validateHackathonCreate = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1-200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description is required and must be between 10-2000 characters'),
  
  body('organizer')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organizer is required and must be between 1-100 characters'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('registrationDeadline')
    .isISO8601()
    .withMessage('Valid registration deadline is required')
    .custom((deadline, { req }) => {
      if (new Date(deadline) >= new Date(req.body.startDate)) {
        throw new Error('Registration deadline must be before start date');
      }
      return true;
    }),
  
  body('location.type')
    .isIn(['online', 'offline', 'hybrid'])
    .withMessage('Location type must be online, offline, or hybrid'),
  
  body('location.venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue cannot exceed 200 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  
  body('categories')
    .isArray({ min: 1 })
    .withMessage('At least one category is required'),
  
  body('categories.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be between 1-50 characters'),
  
  body('teamSize.min')
    .isInt({ min: 1, max: 20 })
    .withMessage('Minimum team size must be between 1-20'),
  
  body('teamSize.max')
    .isInt({ min: 1, max: 20 })
    .withMessage('Maximum team size must be between 1-20')
    .custom((maxSize, { req }) => {
      if (maxSize < req.body.teamSize?.min) {
        throw new Error('Maximum team size must be greater than or equal to minimum team size');
      }
      return true;
    }),
  
  body('prizes')
    .optional()
    .isArray()
    .withMessage('Prizes must be an array'),
  
  body('prizes.*.position')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Prize position must be between 1-50 characters'),
  
  body('prizes.*.amount')
    .optional()
    .isNumeric()
    .withMessage('Prize amount must be a number'),
  
  body('prizes.*.currency')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Currency must be between 1-10 characters'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each requirement must be between 1-200 characters'),
  
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  
  body('technologies.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each technology must be between 1-50 characters'),
  
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  
  body('registrationUrl')
    .optional()
    .isURL()
    .withMessage('Registration URL must be valid'),
  
  body('websiteUrl')
    .optional()
    .isURL()
    .withMessage('Website URL must be valid'),
  
  body('participants')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Participants count must be a non-negative integer'),
  
  handleValidationErrors
];

const validateHackathonUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10-2000 characters'),
  
  body('organizer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organizer must be between 1-100 characters'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Valid registration deadline is required'),
  
  body('location.type')
    .optional()
    .isIn(['online', 'offline', 'hybrid'])
    .withMessage('Location type must be online, offline, or hybrid'),
  
  body('location.venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue cannot exceed 200 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one category is required'),
  
  body('categories.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be between 1-50 characters'),
  
  body('teamSize.min')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Minimum team size must be between 1-20'),
  
  body('teamSize.max')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Maximum team size must be between 1-20'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  
  body('registrationUrl')
    .optional()
    .isURL()
    .withMessage('Registration URL must be valid'),
  
  body('websiteUrl')
    .optional()
    .isURL()
    .withMessage('Website URL must be valid'),
  
  body('participants')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Participants count must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed'])
    .withMessage('Status must be upcoming, ongoing, or completed'),
  
  handleValidationErrors
];

// Team update validation
const validateTeamUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Team name must be between 1-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max members must be between 1-10'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be boolean'),
  
  body('status')
    .optional()
    .isIn(['forming', 'complete', 'competing'])
    .withMessage('Status must be forming, complete, or competing'),
  
  handleValidationErrors
];

// Request response validation
const validateRequestResponse = [
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be either accepted or rejected'),
  
  handleValidationErrors
];

// Matching feedback validation
const validateMatchingRequest = [
  body('matchedUserId')
    .isMongoId()
    .withMessage('Valid matched user ID is required'),
  
  body('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1-5'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters'),
  
  body('interested')
    .isBoolean()
    .withMessage('Interested must be a boolean value'),
  
  handleValidationErrors
];

// Create a combined validator for hackathons (what your route is expecting)
const validateHackathon = validateHackathonCreate; // Use create validation for both create and update

module.exports = {
  validateUserUpdate,
  validateProfileUpdate,
  validateRegister,
  validateLogin,
  validateTeamCreation: validateTeamCreate,
  validateTeamUpdate,
  validateSendRequest,
  validateRequestResponse,
  validateMatchingRequest, // Add this export
  validateHackathonCreate,
  validateHackathonUpdate,
  validateHackathon, // Add this export
  handleValidationErrors,
};