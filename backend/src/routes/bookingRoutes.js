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

// Booking routes - accessible to authenticated drivers and hosts
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.patch('/:id/cancel', protect, cancelBooking);

// Homeowner routes
router.get('/host-requests', protect, authorize('homeowner'), getHostBookings);
router.patch('/:id/status', protect, authorize('homeowner'), updateStatus);

module.exports = router;
