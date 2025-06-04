// src/routes/requests.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// Import controller
const requestController = require('../controllers/requestController');

// Validation middleware for sending requests
const validateSendRequest = [
  body('toUserId')
    .notEmpty()
    .withMessage('Recipient user ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('hackathonId')
    .notEmpty()
    .withMessage('Hackathon ID is required')
    .isMongoId()
    .withMessage('Invalid hackathon ID format'),
  body('type')
    .isIn(['teammate', 'team_invite'])
    .withMessage('Type must be either "teammate" or "team_invite"'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  body('teamId')
    .optional()
    .isMongoId()
    .withMessage('Invalid team ID format')
];

// Routes
router.get('/received', authenticateToken, requestController.getReceivedRequests);
router.get('/sent', authenticateToken, requestController.getSentRequests);
router.post('/send', authenticateToken, validateSendRequest, requestController.sendRequest);
router.put('/:requestId/accept', authenticateToken, requestController.acceptRequest);
router.put('/:requestId/reject', authenticateToken, requestController.rejectRequest);
router.delete('/:requestId', authenticateToken, requestController.cancelRequest);

module.exports = router;