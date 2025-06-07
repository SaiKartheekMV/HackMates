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

// Protected routes - require authentication
router.use(authenticateToken);

router.get('/my', teamController.getMyTeams);
router.post('/', validateTeamCreation, teamController.createTeam);

// Team routes
router.get('/:id', validateObjectId, teamController.getTeamById);
router.put('/:id', validateObjectId, validateTeamUpdate, teamController.updateTeam);
router.delete('/:id', validateObjectId, teamController.deleteTeam);
router.post('/:id/join', validateObjectId, teamController.joinTeam);
router.post('/:id/leave', validateObjectId, teamController.leaveTeam);
router.delete('/:id/member/:memberId', validateObjectId, teamController.removeMember);

// Better approach: Use consistent parameter naming and different route structure
router.delete('/:id/member/:memberId', teamController.removeMember);

module.exports = router;