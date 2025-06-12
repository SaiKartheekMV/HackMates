const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');
const { 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  createTeamLimiter 
} = require('../middleware/rateLimiter');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Create validateRequest function since it's not properly exported
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Create placeholder controller methods if they don't exist
const safeTeamController = {
  createTeam: teamController.createTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'createTeam method not implemented' });
  }),
  getUserTeams: teamController.getUserTeams || ((req, res) => {
    res.status(501).json({ success: false, message: 'getUserTeams method not implemented' });
  }),
  getTeam: teamController.getTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'getTeam method not implemented' });
  }),
  updateTeam: teamController.updateTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'updateTeam method not implemented' });
  }),
  deleteTeam: teamController.deleteTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'deleteTeam method not implemented' });
  }),
  joinTeam: teamController.joinTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'joinTeam method not implemented' });
  }),
  leaveTeam: teamController.leaveTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'leaveTeam method not implemented' });
  }),
  inviteToTeam: teamController.inviteToTeam || ((req, res) => {
    res.status(501).json({ success: false, message: 'inviteToTeam method not implemented' });
  }),
  kickMember: teamController.kickMember || ((req, res) => {
    res.status(501).json({ success: false, message: 'kickMember method not implemented' });
  }),
  transferLeadership: teamController.transferLeadership || ((req, res) => {
    res.status(501).json({ success: false, message: 'transferLeadership method not implemented' });
  }),
  updateMemberPermissions: teamController.updateMemberPermissions || ((req, res) => {
    res.status(501).json({ success: false, message: 'updateMemberPermissions method not implemented' });
  }),
  getHackathonTeams: teamController.getHackathonTeams || ((req, res) => {
    res.status(501).json({ success: false, message: 'getHackathonTeams method not implemented' });
  }),
  getTeamRecommendations: teamController.getTeamRecommendations || ((req, res) => {
    res.status(501).json({ success: false, message: 'getTeamRecommendations method not implemented' });
  }),
  getTeamStats: teamController.getTeamStats || ((req, res) => {
    res.status(501).json({ success: false, message: 'getTeamStats method not implemented' });
  })
};

// Apply authentication to all team routes
router.use(authenticateToken);

// Additional rate limiters for team-specific actions
const rateLimit = require('express-rate-limit');

const joinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 join attempts per window
  message: {
    success: false,
    message: 'Too many join attempts. Please try again later.'
  }
});

const inviteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 invitations per window
  message: {
    success: false,
    message: 'Too many invitations sent. Please try again later.'
  }
});

const updateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Max 5 updates per minute
  message: {
    success: false,
    message: 'Too many update attempts. Please try again later.'
  }
});

// Validation schemas
const createTeamValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('hackathonId')
    .isMongoId()
    .withMessage('Invalid hackathon ID'),
  body('maxMembers')
    .isInt({ min: 2, max: 10 })
    .withMessage('Team size must be between 2 and 10 members'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('requiredSkills.*.skill')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Skill name must be between 2 and 50 characters'),
  body('requiredSkills.*.priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  body('preferredRoles')
    .optional()
    .isArray()
    .withMessage('Preferred roles must be an array'),
  body('preferredRoles.*.role')
    .optional()
    .isIn(['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'])
    .withMessage('Invalid role specified'),
  body('preferredRoles.*.count')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role count must be at least 1'),
  body('project.name')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Project name cannot exceed 150 characters'),
  body('project.category')
    .optional()
    .isIn(['web', 'mobile', 'ai_ml', 'blockchain', 'iot', 'ar_vr', 'gaming', 'fintech', 'healthtech', 'edtech', 'other'])
    .withMessage('Invalid project category'),
  body('project.repositoryUrl')
    .optional()
    .isURL()
    .withMessage('Repository URL must be valid'),
  body('communication.primaryChannel')
    .optional()
    .isIn(['discord', 'slack', 'telegram', 'whatsapp', 'teams', 'other'])
    .withMessage('Invalid communication channel'),
  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('settings.allowDirectJoin')
    .optional()
    .isBoolean()
    .withMessage('allowDirectJoin must be a boolean'),
  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean'),
  body('location.preference')
    .optional()
    .isIn(['remote', 'hybrid', 'in_person'])
    .withMessage('Invalid location preference'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters')
];

const updateTeamValidation = [
  param('teamId').isMongoId().withMessage('Invalid team ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Team size must be between 2 and 10 members')
];

const teamIdValidation = [
  param('teamId').isMongoId().withMessage('Invalid team ID')
];

const hackathonIdValidation = [
  param('hackathonId').isMongoId().withMessage('Invalid hackathon ID')
];

const joinTeamValidation = [
  param('teamId').isMongoId().withMessage('Invalid team ID'),
  body('role')
    .optional()
    .isIn(['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'])
    .withMessage('Invalid role specified'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

const inviteValidation = [
  param('teamId').isMongoId().withMessage('Invalid team ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'])
    .withMessage('Invalid role specified'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

const transferLeadershipValidation = [
  param('teamId').isMongoId().withMessage('Invalid team ID'),
  body('newLeaderId').isMongoId().withMessage('Invalid user ID')
];

const updatePermissionsValidation = [
  param('teamId').isMongoId().withMessage('Invalid team ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('permissions.canInvite')
    .optional()
    .isBoolean()
    .withMessage('canInvite must be a boolean'),
  body('permissions.canKick')
    .optional()
    .isBoolean()
    .withMessage('canKick must be a boolean'),
  body('permissions.canEditTeam')
    .optional()
    .isBoolean()
    .withMessage('canEditTeam must be a boolean')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sortBy')
    .optional()
    .isIn(['lastActivity', 'newest', 'oldest', 'mostViewed', 'teamSize'])
    .withMessage('Invalid sort option')
];

// Team CRUD routes
/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private
 */
router.post(
  '/',
  createTeamLimiter,
  createTeamValidation,
  validateRequest,
  safeTeamController.createTeam
);

/**
 * @route   GET /api/teams/my
 * @desc    Get current user's teams
 * @access  Private
 */
router.get(
  '/my',
  [
    query('status')
      .optional()
      .isIn(['forming', 'complete', 'competing', 'finished', 'disbanded'])
      .withMessage('Invalid status'),
    query('hackathonId')
      .optional()
      .isMongoId()
      .withMessage('Invalid hackathon ID')
  ],
  validateRequest,
  safeTeamController.getUserTeams
);

/**
 * @route   GET /api/teams/:teamId
 * @desc    Get team details
 * @access  Private
 */
router.get(
  '/:teamId',
  [
    ...teamIdValidation,
    query('detailed')
      .optional()
      .isBoolean()
      .withMessage('detailed must be a boolean')
  ],
  validateRequest,
  safeTeamController.getTeam
);

/**
 * @route   PUT /api/teams/:teamId
 * @desc    Update team information
 * @access  Private (Team leader or members with edit permission)
 */
router.put(
  '/:teamId',
  updateLimiter,
  updateTeamValidation,
  validateRequest,
  safeTeamController.updateTeam
);

/**
 * @route   DELETE /api/teams/:teamId
 * @desc    Disband team
 * @access  Private (Team leader only)
 */
router.delete(
  '/:teamId',
  teamIdValidation,
  validateRequest,
  safeTeamController.deleteTeam
);

// Team membership routes
/**
 * @route   POST /api/teams/:teamId/join
 * @desc    Join a team or request to join
 * @access  Private
 */
router.post(
  '/:teamId/join',
  joinLimiter,
  joinTeamValidation,
  validateRequest,
  safeTeamController.joinTeam
);

/**
 * @route   POST /api/teams/:teamId/leave
 * @desc    Leave a team
 * @access  Private
 */
router.post(
  '/:teamId/leave',
  [
    ...teamIdValidation,
    body('transferTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID for leadership transfer')
  ],
  validateRequest,
  safeTeamController.leaveTeam
);

/**
 * @route   POST /api/teams/:teamId/invite
 * @desc    Invite user to team
 * @access  Private (Team leader or members with invite permission)
 */
router.post(
  '/:teamId/invite',
  inviteLimiter,
  inviteValidation,
  validateRequest,
  safeTeamController.inviteToTeam
);

/**
 * @route   DELETE /api/teams/:teamId/members/:userId
 * @desc    Remove/kick member from team
 * @access  Private (Team leader or members with kick permission)
 */
router.delete(
  '/:teamId/members/:userId',
  [
    param('teamId').isMongoId().withMessage('Invalid team ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Reason cannot exceed 200 characters')
  ],
  validateRequest,
  safeTeamController.kickMember
);

// Team management routes
/**
 * @route   POST /api/teams/:teamId/transfer-leadership
 * @desc    Transfer team leadership
 * @access  Private (Team leader only)
 */
router.post(
  '/:teamId/transfer-leadership',
  transferLeadershipValidation,
  validateRequest,
  safeTeamController.transferLeadership
);

/**
 * @route   PUT /api/teams/:teamId/members/:userId/permissions
 * @desc    Update member permissions
 * @access  Private (Team leader only)
 */
router.put(
  '/:teamId/members/:userId/permissions',
  updatePermissionsValidation,
  validateRequest,
  safeTeamController.updateMemberPermissions
);

// Discovery and search routes
/**
 * @route   GET /api/teams/hackathon/:hackathonId
 * @desc    Get teams for a specific hackathon with filters
 * @access  Private
 */
router.get(
  '/hackathon/:hackathonId',
  [
    ...hackathonIdValidation,
    ...paginationValidation,
    query('status')
      .optional()
      .isIn(['forming', 'complete', 'competing', 'finished'])
      .withMessage('Invalid status'),
    query('skills')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          const skills = value.split(',');
          return skills.every(skill => skill.trim().length >= 2);
        }
        return false;
      })
      .withMessage('Skills must be comma-separated strings with at least 2 characters each'),
    query('hasOpenings')
      .optional()
      .isBoolean()
      .withMessage('hasOpenings must be a boolean'),
    query('location')
      .optional()
      .isIn(['remote', 'hybrid', 'in_person'])
      .withMessage('Invalid location preference'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters')
  ],
  validateRequest,
  safeTeamController.getHackathonTeams
);

/**
 * @route   GET /api/teams/recommendations/:hackathonId
 * @desc    Get AI-powered team recommendations for user
 * @access  Private
 */
router.get(
  '/recommendations/:hackathonId',
  [
    ...hackathonIdValidation,
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ],
  validateRequest,
  safeTeamController.getTeamRecommendations
);

// Analytics routes
/**
 * @route   GET /api/teams/:teamId/stats
 * @desc    Get team statistics and analytics
 * @access  Private (Team members only)
 */
router.get(
  '/:teamId/stats',
  teamIdValidation,
  validateRequest,
  safeTeamController.getTeamStats
);

// Global error handler for team routes
router.use((error, req, res, next) => {
  console.error('Team route error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;