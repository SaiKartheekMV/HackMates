const express = require('express');
const { body, query } = require('express-validator');
const {
  getHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getHackathonTeams,
  registerForHackathon,
  unregisterFromHackathon,
  getMyHackathons,
  searchHackathons
} = require('../controllers/hackathonController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/hackathons
// @desc    Get all hackathons with filters and pagination
// @access  Public
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'all'])
    .withMessage('Status must be upcoming, ongoing, completed, or all'),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  query('location')
    .optional()
    .isIn(['online', 'offline', 'hybrid'])
    .withMessage('Location must be online, offline, or hybrid'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2-50 characters')
], getHackathons);

// @route   GET /api/hackathons/search
// @desc    Search hackathons
// @access  Public
router.get('/search', [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2-100 characters')
], searchHackathons);

// @route   GET /api/hackathons/my
// @desc    Get user's registered hackathons
// @access  Private
router.get('/my', authenticate, getMyHackathons);

// @route   GET /api/hackathons/:id
// @desc    Get hackathon by ID
// @access  Public
router.get('/:id', getHackathonById);

// @route   POST /api/hackathons
// @desc    Create hackathon (Admin only)
// @access  Private/Admin
router.post('/', [
  authenticate,
  authorize('admin'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50-2000 characters'),
  body('organizer')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Organizer must be between 2-100 characters'),
  body('startDate')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      if (value <= req.body.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('registrationDeadline')
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      if (value >= req.body.startDate) {
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
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2-100 characters'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2-100 characters'),
  body('categories')
    .isArray({ min: 1, max: 10 })
    .withMessage('Categories must be an array with 1-10 items'),
  body('categories.*')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each category must be between 2-50 characters'),
  body('teamSize.min')
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum team size must be between 1-10'),
  body('teamSize.max')
    .isInt({ min: 1, max: 20 })
    .withMessage('Maximum team size must be between 1-20')
    .custom((value, { req }) => {
      if (value < req.body.teamSize.min) {
        throw new Error('Maximum team size must be greater than or equal to minimum');
      }
      return true;
    }),
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
  body('prizes')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Prizes must be an array with maximum 10 items'),
  body('prizes.*.position')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Prize position must be between 1-50 characters'),
  body('prizes.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prize amount must be a positive number'),
  body('prizes.*.currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('requirements')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Requirements must be an array with maximum 20 items'),
  body('technologies')
    .optional()
    .isArray({ max: 30 })
    .withMessage('Technologies must be an array with maximum 30 items')
], createHackathon);

// @route   PUT /api/hackathons/:id
// @desc    Update hackathon (Admin only)
// @access  Private/Admin
router.put('/:id', [
  authenticate,
  authorize('admin'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50-2000 characters'),
  body('organizer')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Organizer must be between 2-100 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .toDate(),
  body('endDate')
    .optional()
    .isISO8601()
    .toDate(),
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .toDate(),
  body('location.type')
    .optional()
    .isIn(['online', 'offline', 'hybrid'])
    .withMessage('Location type must be online, offline, or hybrid'),
  body('categories')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Categories must be an array with 1-10 items'),
  body('teamSize.min')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum team size must be between 1-10'),
  body('teamSize.max')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Maximum team size must be between 1-20'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed'])
    .withMessage('Status must be upcoming, ongoing, or completed')
], updateHackathon);

// @route   DELETE /api/hackathons/:id
// @desc    Delete hackathon (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), deleteHackathon);

// @route   GET /api/hackathons/:id/teams
// @desc    Get teams for a hackathon
// @access  Public
router.get('/:id/teams', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], getHackathonTeams);

// @route   POST /api/hackathons/:id/register
// @desc    Register for hackathon
// @access  Private
router.post('/:id/register', authenticate, registerForHackathon);

// @route   DELETE /api/hackathons/:id/register
// @desc    Unregister from hackathon
// @access  Private
router.delete('/:id/register', authenticate, unregisterFromHackathon);

module.exports = router;