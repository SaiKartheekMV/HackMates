// src/routes/hackathons.js
const express = require('express');
const router = express.Router();
const hackathonController = require('../controllers/hackathonController');

const { authenticateToken } = require('../middleware/auth');

// Import the correct validation functions
const { 
  validateHackathonCreate, 
  validateHackathonUpdate 
} = require('../middleware/validation');

// Public routes
router.get('/', hackathonController.getHackathons);
router.get('/:id', hackathonController.getHackathonById);
router.get('/:id/teams', hackathonController.getHackathonTeams);

// Protected routes
router.use(authenticateToken);

// Admin only routes (admin check handled in controller)
router.post('/', validateHackathonCreate, hackathonController.createHackathon);
router.put('/:id', validateHackathonUpdate, hackathonController.updateHackathon);
router.delete('/:id', hackathonController.deleteHackathon);

module.exports = router;