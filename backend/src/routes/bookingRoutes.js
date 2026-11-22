const express = require('express');
const router = express.Router();
const {
  createBooking,
  checkAvailability,
  getMyBookings,
  getHostBookings,
  cancelBooking,
  updateStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// Public or Driver availability check
router.get('/check-availability', checkAvailability);

// Driver routes
router.post('/', protect, authorize('driver'), createBooking);
router.get('/my-bookings', protect, authorize('driver'), getMyBookings);
router.patch('/:id/cancel', protect, cancelBooking);

// Homeowner routes
router.get('/host-requests', protect, authorize('homeowner'), getHostBookings);
router.patch('/:id/status', protect, authorize('homeowner'), updateStatus);

module.exports = router;
