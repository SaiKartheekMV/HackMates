// src/routes/teams.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');

// Import validation middleware - if it doesn't exist, we'll create basic ones
let validateTeamCreation, validateTeamUpdate;
try {
  const validation = require('../middleware/validation');
  validateTeamCreation = validation.validateTeamCreation;
  validateTeamUpdate = validation.validateTeamUpdate;
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
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    next();
  };
}

const validateObjectId = (req, res, next) => {
  const { id, memberId } = req.params;
  
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
  
  next();
};

// Error handling middleware for async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Protected routes - require authentication
router.use(authenticateToken);

// Team routes with error handling
router.get('/my', asyncHandler(teamController.getMyTeams));
router.post('/', validateTeamCreation, asyncHandler(teamController.createTeam));

router.get('/:id', validateObjectId, asyncHandler(teamController.getTeamById));
router.put('/:id', validateObjectId, validateTeamUpdate, asyncHandler(teamController.updateTeam));
router.delete('/:id', validateObjectId, asyncHandler(teamController.deleteTeam));
router.post('/:id/join', validateObjectId, asyncHandler(teamController.joinTeam));
router.post('/:id/leave', validateObjectId, asyncHandler(teamController.leaveTeam));
router.delete('/:id/member/:memberId', validateObjectId, asyncHandler(teamController.removeMember));

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
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

module.exports = router;