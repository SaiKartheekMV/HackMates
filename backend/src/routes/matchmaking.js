// src/routes/matchmaking.js
const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { validateMatchingRequest } = require('../middleware/validation');

// Import controller
const {
  getSuggestions,
  checkCompatibility,
  submitFeedback,
  getMatchHistory
} = require('../controllers/matchmakingController');

// Routes
router.get('/suggestions', authenticateToken, getSuggestions);
router.get('/compatibility/:userId', authenticateToken, checkCompatibility);
router.post('/feedback', authenticateToken, validateMatchingRequest, submitFeedback);
router.get('/history', authenticateToken, getMatchHistory);

module.exports = router;