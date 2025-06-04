// src/routes/profiles.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

// Protected routes - require authentication
router.use(authenticateToken);

// Personal profile routes
router.get('/me', profileController.getMyProfile);
router.put('/me', validateProfileUpdate, profileController.updateMyProfile);
router.post('/me/upload-resume', profileController.uploadResume);
router.post('/me/calculate-completion', profileController.calculateCompletion);

// Public profile route (should be last to avoid conflicts)
router.get('/:userId', profileController.getPublicProfile);

module.exports = router;