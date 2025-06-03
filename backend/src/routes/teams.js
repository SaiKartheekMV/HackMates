const express = require('express');
const { body, query } = require('express-validator');
const {
  getMyTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  removeTeamMember,
  transferLeadership,
  getTeamMembers,
  searchTeams
} = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/teams/my
// @desc    Get current user's teams
// @access  Private
router.get('/my', authenticate, getMyTeams);

// @route   GET /api/teams/search
// @desc    Search teams
// @access  Private
router.get('/search', [
  authenticate,
  query('hackathonId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2-100 characters'),
  query('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], searchTeams);

// @route   POST /api/teams
// @desc    Create team
// @access  Private
router.post('/', [
  authenticate,
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3-100 characters'),
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
    .isArray({ max: 10 })
    .withMessage('Required skills must be an array with maximum 10 items'),
  body('requiredSkills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each skill must be between 1-30 characters'),
  body('maxMembers')
    .isInt({ min: 2, max: 10 })
    .withMessage('Maximum members must be between 2-10'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], createTeam);

// @route   GET /api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get('/:id', authenticate, getTeamById);

// @route   PUT /api/teams/:id
// @desc    Update team (Team leader only)
// @access  Private
router.put('/:id', [
  authenticate,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('requiredSkills')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Required skills must be an array with maximum 10 items'),
  body('requiredSkills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each skill must be between 1-30 characters'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Maximum members must be between 2-10'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('status')
    .optional()
    .isIn(['forming', 'complete', 'competing'])
    .withMessage('Status must be forming, complete, or competing')
], updateTeam);

// @route   DELETE /api/teams/:id
// @desc    Delete team (Team leader only)
// @access  Private
router.delete('/:id', authenticate, deleteTeam);

// @route   POST /api/teams/:id/join
// @desc    Join public team
// @access  Private
router.post('/:id/join', authenticate, joinTeam);

// @route   POST /api/teams/:id/leave
// @desc    Leave team
// @access  Private
router.post('/:id/leave', authenticate, leaveTeam);

// @route   DELETE /api/teams/:id/members/:memberId
// @desc    Remove team member (Team leader only)
// @access  Private
router.delete('/:id/members/:memberId', authenticate, removeTeamMember);

// @route   PUT /api/teams/:id/transfer-leadership
// @desc    Transfer team leadership (Team leader only)
// @access  Private
router.put('/:id/transfer-leadership', [
  authenticate,
  body('newLeaderId')
    .isMongoId()
    .withMessage('Valid new leader ID is required')
], transferLeadership);

// @route   GET /api/teams/:id/members
// @desc    Get team members
// @access  Private
router.get('/:id/members', authenticate, getTeamMembers);

module.exports = router;