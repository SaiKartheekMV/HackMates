// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const {
  getMatches,
  sendMatchRequest,
  getMatchRequests,
  respondToMatch,
  cancelMatchRequest,
  getMatchStats,
  getMutualMatches
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/stats', getMatchStats);
router.get('/mutual', getMutualMatches);
router.get('/requests', getMatchRequests);
router.get('/:eventId', getMatches);

router.post('/request', sendMatchRequest);
router.put('/:id/respond', respondToMatch);
router.delete('/:id', cancelMatchRequest);

module.exports = router;