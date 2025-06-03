const express = require('express');
const { body, query, param } = require('express-validator');
const {
  getReceivedRequests,
  getSentRequests,
  sendHackRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getRequestById,
  getRequestStats
} = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(apiLimiter);

/**
 * @route   GET /api/requests/received
 * @desc    Get all received hack requests for authenticated user
 * @access  Private
 * @query   page, limit, status, hackathonId
 */
router.get('/received', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected'])
    .withMessage('Status must be pending, accepted, or rejected'),
  query('hackathonId')
    .optional()
    .isMongoId()
    .withMessage('Invalid hackathon ID'),
  validateRequest
], getReceivedRequests);

/**
 * @route   GET /api/requests/sent
 * @desc    Get all sent hack requests for authenticated user
 * @access  Private
 * @query   page, limit, status, hackathonId
 */
router.get('/sent', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected'])
    .withMessage('Status must be pending, accepted, or rejected'),
  query('hackathonId')
    .optional()
    .isMongoId()
    .withMessage('Invalid hackathon ID'),
  validateRequest
], getSentRequests);

/**
 * @route   GET /api/requests/stats
 * @desc    Get request statistics for authenticated user
 * @access  Private
 */
router.get('/stats', getRequestStats);

/**
 * @route   GET /api/requests/:id
 * @desc    Get specific request details
 * @access  Private
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  validateRequest
], getRequestById);

/**
 * @route   POST /api/requests/send
 * @desc    Send a hack request to another user
 * @access  Private
 * @body    toUserId, hackathonId, teamId (optional), message, type
 */
router.post('/send', [
  body('toUserId')
    .isMongoId()
    .withMessage('Valid recipient user ID is required'),
  body('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  body('teamId')
    .optional()
    .isMongoId()
    .withMessage('Team ID must be valid if provided'),
  body('message')
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters')
    .trim()
    .escape(),
  body('type')
    .isIn(['teammate', 'team_invite'])
    .withMessage('Type must be either teammate or team_invite'),
  validateRequest
], sendHackRequest);

/**
 * @route   PUT /api/requests/:id/accept
 * @desc    Accept a received hack request
 * @access  Private
 */
router.put('/:id/accept', [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Response message cannot exceed 200 characters')
    .trim()
    .escape(),
  validateRequest
], acceptRequest);

/**
 * @route   PUT /api/requests/:id/reject
 * @desc    Reject a received hack request
 * @access  Private
 */
router.put('/:id/reject', [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Response message cannot exceed 200 characters')
    .trim()
    .escape(),
  validateRequest
], rejectRequest);

/**
 * @route   DELETE /api/requests/:id
 * @desc    Cancel a sent hack request (only if pending)
 * @access  Private
 */
router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  validateRequest
], cancelRequest);

/**
 * @route   POST /api/requests/bulk-action
 * @desc    Perform bulk actions on multiple requests
 * @access  Private
 * @body    requestIds, action
 */
router.post('/bulk-action', [
  body('requestIds')
    .isArray({ min: 1, max: 20 })
    .withMessage('Request IDs must be an array with 1-20 items'),
  body('requestIds.*')
    .isMongoId()
    .withMessage('All request IDs must be valid'),
  body('action')
    .isIn(['accept', 'reject', 'cancel'])
    .withMessage('Action must be accept, reject, or cancel'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Message cannot exceed 200 characters')
    .trim()
    .escape(),
  validateRequest
], async (req, res, next) => {
  try {
    const { requestIds, action, message } = req.body;
    const results = [];
    const errors = [];

    for (const requestId of requestIds) {
      try {
        let result;
        switch (action) {
          case 'accept':
            result = await acceptRequest({ 
              params: { id: requestId }, 
              user: req.user, 
              body: { message } 
            }, null, () => {});
            break;
          case 'reject':
            result = await rejectRequest({ 
              params: { id: requestId }, 
              user: req.user, 
              body: { message } 
            }, null, () => {});
            break;
          case 'cancel':
            result = await cancelRequest({ 
              params: { id: requestId }, 
              user: req.user 
            }, null, () => {});
            break;
        }
        results.push({ requestId, success: true });
      } catch (error) {
        errors.push({ requestId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/requests/user/:userId/status
 * @desc    Check if there's an existing request between current user and specified user
 * @access  Private
 */
router.get('/user/:userId/status', [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  query('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  validateRequest
], async (req, res, next) => {
  try {
    const HackRequest = require('../models/HackRequest');
    const { userId } = req.params;
    const { hackathonId } = req.query;
    const currentUserId = req.user._id;

    // Check for existing requests in both directions
    const existingRequest = await HackRequest.findOne({
      $or: [
        { fromUserId: currentUserId, toUserId: userId, hackathonId },
        { fromUserId: userId, toUserId: currentUserId, hackathonId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    res.json({
      success: true,
      hasExistingRequest: !!existingRequest,
      requestStatus: existingRequest?.status || null,
      requestType: existingRequest?.type || null,
      isRequestSender: existingRequest?.fromUserId.toString() === currentUserId.toString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/requests/:id/remind
 * @desc    Send a reminder for a pending request
 * @access  Private
 */
router.post('/:id/remind', [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  validateRequest
], async (req, res, next) => {
  try {
    const HackRequest = require('../models/HackRequest');
    const { sendRequestReminder } = require('../services/emailService');
    
    const request = await HackRequest.findById(req.params.id)
      .populate('fromUserId', 'firstName lastName email')
      .populate('toUserId', 'firstName lastName email')
      .populate('hackathonId', 'title');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Only sender can send reminders
    if (request.fromUserId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only send reminders for your own requests'
      });
    }

    // Only allow reminders for pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only send reminders for pending requests'
      });
    }

    // Check if reminder was sent recently (prevent spam)
    const lastReminder = request.lastReminderSent;
    const now = new Date();
    const daysSinceLastReminder = lastReminder ? 
      (now - lastReminder) / (1000 * 60 * 60 * 24) : Infinity;

    if (daysSinceLastReminder < 3) {
      return res.status(429).json({
        success: false,
        message: 'You can only send reminders once every 3 days'
      });
    }

    // Send reminder email
    await sendRequestReminder(request);

    // Update last reminder timestamp
    request.lastReminderSent = now;
    await request.save();

    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;