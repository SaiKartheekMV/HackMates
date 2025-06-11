// src/routes/teams.js
const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/teamController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Create controller instance and bind methods
const teamControllerInstance = new TeamController();
const teamController = {
  createTeam: teamControllerInstance.createTeam.bind(teamControllerInstance),
  getTeams: teamControllerInstance.getTeams.bind(teamControllerInstance),
  getTeam: teamControllerInstance.getTeam.bind(teamControllerInstance),
  updateTeam: teamControllerInstance.updateTeam.bind(teamControllerInstance),
  deleteTeam: teamControllerInstance.deleteTeam.bind(teamControllerInstance),
  joinTeam: teamControllerInstance.joinTeam.bind(teamControllerInstance),
  leaveTeam: teamControllerInstance.leaveTeam.bind(teamControllerInstance),
  removeMember: teamControllerInstance.removeMember.bind(teamControllerInstance),
  updateMemberRole: teamControllerInstance.updateMemberRole.bind(teamControllerInstance),
  transferLeadership: teamControllerInstance.transferLeadership.bind(teamControllerInstance),
  addCoLeader: teamControllerInstance.addCoLeader.bind(teamControllerInstance),
  getApplications: teamControllerInstance.getApplications.bind(teamControllerInstance),
  reviewApplication: teamControllerInstance.reviewApplication.bind(teamControllerInstance),
  generateInviteLink: teamControllerInstance.generateInviteLink.bind(teamControllerInstance),
  joinViaInvite: teamControllerInstance.joinViaInvite.bind(teamControllerInstance),
  updateProject: teamControllerInstance.updateProject.bind(teamControllerInstance),
  submitProject: teamControllerInstance.submitProject.bind(teamControllerInstance),
  searchTeams: teamControllerInstance.searchTeams.bind(teamControllerInstance),
  getFeaturedTeams: teamControllerInstance.getFeaturedTeams.bind(teamControllerInstance),
  getTrendingTeams: teamControllerInstance.getTrendingTeams.bind(teamControllerInstance),
  getRecommendations: teamControllerInstance.getRecommendations.bind(teamControllerInstance),
  getTeamAnalytics: teamControllerInstance.getTeamAnalytics.bind(teamControllerInstance),
  getMyTeams: teamControllerInstance.getMyTeams.bind(teamControllerInstance),
  toggleLike: teamControllerInstance.toggleLike.bind(teamControllerInstance),
  toggleFollow: teamControllerInstance.toggleFollow.bind(teamControllerInstance),
  addReview: teamControllerInstance.addReview.bind(teamControllerInstance),
  updateSettings: teamControllerInstance.updateSettings.bind(teamControllerInstance)
};

// Import validation middleware - if it doesn't exist, we'll create basic ones
let validateTeamCreation, validateTeamUpdate, validateApplication, validateInvite;
try {
  const validation = require('../middleware/validation');
  validateTeamCreation = validation.validateTeamCreation;
  validateTeamUpdate = validation.validateTeamUpdate;
  validateApplication = validation.validateApplication;
  validateInvite = validation.validateInvite;
} catch (error) {
  console.log('Validation middleware not found, using basic validation');
  
  // Basic validation middleware as fallback
  validateTeamCreation = (req, res, next) => {
    const { name, hackathonId } = req.body;
    if (!name || !hackathonId) {
      return res.status(400).json({
        success: false,
        message: 'Name and hackathonId are required'
      });
    }
    next();
  };
  
  validateTeamUpdate = (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required for update'
      });
    }
    next();
  };

  validateApplication = (req, res, next) => {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required for application'
      });
    }
    next();
  };

  validateInvite = (req, res, next) => {
    const { maxUses, expiresIn } = req.body;
    if (maxUses && (maxUses < 1 || maxUses > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Max uses must be between 1 and 100'
      });
    }
    if (expiresIn && (expiresIn < 1 || expiresIn > 168)) {
      return res.status(400).json({
        success: false,
        message: 'Expires in must be between 1 and 168 hours'
      });
    }
    next();
  };
}

const validateObjectId = (req, res, next) => {
  const { id, memberId, applicationId } = req.params;
  
  if (id && !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid team ID format'
    });
  }
  
  if (memberId && !memberId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid member ID format'
    });
  }

  if (applicationId && !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid application ID format'
    });
  }
  
  next();
};

// Error handling middleware for async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ===== PUBLIC ROUTES =====
// These routes can be accessed without authentication but may have optional auth for better experience

// Get teams with filters and pagination - public with optional auth for personalization
router.get('/', optionalAuth, asyncHandler(teamController.getTeams));

// Search teams - public
router.get('/search', optionalAuth, asyncHandler(teamController.searchTeams));

// Get featured teams - public
router.get('/featured', optionalAuth, asyncHandler(teamController.getFeaturedTeams));

// Get trending teams - public
router.get('/trending', optionalAuth, asyncHandler(teamController.getTrendingTeams));

// Get team by ID or slug - public with optional auth
router.get('/:identifier', optionalAuth, asyncHandler(teamController.getTeam));

// Join team via invite link - requires auth
router.post('/join/:code', authenticateToken, asyncHandler(teamController.joinViaInvite));

// ===== PROTECTED ROUTES =====
// All routes below require authentication
router.use(authenticateToken);

// ===== USER'S TEAMS =====
router.get('/my/teams', asyncHandler(teamController.getMyTeams));
router.get('/my/recommendations', asyncHandler(teamController.getRecommendations));

// ===== TEAM CRUD OPERATIONS =====
router.post('/', validateTeamCreation, asyncHandler(teamController.createTeam));
router.put('/:id', validateObjectId, validateTeamUpdate, asyncHandler(teamController.updateTeam));
router.delete('/:id', validateObjectId, asyncHandler(teamController.deleteTeam));

// ===== TEAM MEMBERSHIP =====
router.post('/:id/join', validateObjectId, asyncHandler(teamController.joinTeam));
router.post('/:id/leave', validateObjectId, asyncHandler(teamController.leaveTeam));
router.delete('/:id/members/:memberId', validateObjectId, asyncHandler(teamController.removeMember));
router.put('/:id/members/:memberId/role', validateObjectId, asyncHandler(teamController.updateMemberRole));

// ===== LEADERSHIP MANAGEMENT =====
router.post('/:id/transfer-leadership', validateObjectId, asyncHandler(teamController.transferLeadership));
router.post('/:id/co-leaders', validateObjectId, asyncHandler(teamController.addCoLeader));

// ===== APPLICATION MANAGEMENT =====
router.get('/:id/applications', validateObjectId, asyncHandler(teamController.getApplications));
router.put('/:id/applications/:applicationId', validateObjectId, asyncHandler(teamController.reviewApplication));

// ===== INVITE MANAGEMENT =====
router.post('/:id/invite-links', validateObjectId, asyncHandler(teamController.generateInviteLink));

// ===== PROJECT MANAGEMENT =====
router.put('/:id/project', validateObjectId, asyncHandler(teamController.updateProject));
router.post('/:id/submit', validateObjectId, asyncHandler(teamController.submitProject));

// ===== TEAM INTERACTIONS =====
router.post('/:id/toggle-like', validateObjectId, asyncHandler(teamController.toggleLike));
router.post('/:id/toggle-follow', validateObjectId, asyncHandler(teamController.toggleFollow));
router.post('/:id/reviews', validateObjectId, asyncHandler(teamController.addReview));

// ===== ANALYTICS =====
router.get('/:id/analytics', validateObjectId, asyncHandler(teamController.getTeamAnalytics));

// ===== SETTINGS =====
router.put('/:id/settings', validateObjectId, asyncHandler(teamController.updateSettings));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Team routes error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry error',
      details: 'A team with this name already exists in this hackathon'
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (error.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

module.exports = router;