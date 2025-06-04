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

// Protected routes - require authentication
router.use(authenticateToken);

// Team routes
router.get('/my', teamController.getMyTeams);
router.post('/', validateTeamCreation, teamController.createTeam);
router.get('/:id', teamController.getTeamById);
router.put('/:id', validateTeamUpdate, teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);
router.post('/:id/join', teamController.joinTeam);
router.post('/:id/leave', teamController.leaveTeam);

// Better approach: Use consistent parameter naming and different route structure
router.delete('/:id/member/:memberId', teamController.removeMember);

module.exports = router;