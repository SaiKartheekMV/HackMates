// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getMyEvents
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes
router.use(protect);

router.get('/user/my-events', getMyEvents);
router.post('/:id/register', registerForEvent);
router.delete('/:id/unregister', unregisterFromEvent);

// Admin/Organizer only routes
router.post('/', authorize('admin', 'organizer'), createEvent);
router.put('/:id', authorize('admin', 'organizer'), updateEvent);
router.delete('/:id', authorize('admin', 'organizer'), deleteEvent);

module.exports = router;