// src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// User routes
router.get('/me', userController.getCurrentUser);
router.put('/me', validateUserUpdate, userController.updateCurrentUser);
router.delete('/me', userController.deleteCurrentUser);

module.exports = router;