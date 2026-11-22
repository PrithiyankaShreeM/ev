const {
  createBooking,
  getChargerById,
  checkSlotAvailability,
  getDriverBookings,
  getOwnerBookings,
  updateBookingStatus
} = require('../services/dataService');

// @desc Check slot availability
// @route GET /api/bookings/check-availability
exports.checkAvailability = async (req, res) => {
  try {
    const { chargerId, date, startTime, endTime } = req.query;

    if (!chargerId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'chargerId, date, startTime, and endTime are required'
      });
    }

    const result = await checkSlotAvailability(chargerId, date, startTime, endTime);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error checking availability'
    });
  }
};

// @desc Create a new booking (Driver)
// @route POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { chargerId, date, startTime, endTime, vehicleInfo } = req.body;

    if (!chargerId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'chargerId, date, startTime, and endTime are required'
      });
    }

    const charger = await getChargerById(chargerId);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found'
      });
    }

    if (charger.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This charger is currently inactive and unavailable for bookings'
      });
    }

    // Calculate duration in hours
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const durationHours = Math.max(0.5, ((eH * 60 + eM) - (sH * 60 + sM)) / 60);

    let totalAmount = 0;
    if (!charger.isFree) {
      const pricePerHour = charger.pricing?.pricePerHour || 40;
      totalAmount = Math.round(durationHours * pricePerHour);
    }

    const booking = await createBooking({
      driver: req.user._id,
      charger: chargerId,
      owner: charger.owner?._id || charger.owner,
      date,
      startTime,
      endTime,
      durationHours,
      totalAmount,
      isFree: Boolean(charger.isFree),
      status: 'confirmed',
      vehicleInfo: vehicleInfo || req.user.vehicle?.model || 'EV'
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to create booking'
    });
  }
};

// @desc Get current driver's bookings
// @route GET /api/bookings/my-bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await getDriverBookings(req.user._id);
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch driver bookings'
    });
  }
};

// @desc Get homeowner's received bookings
// @route GET /api/bookings/host-requests
exports.getHostBookings = async (req, res) => {
  try {
    const bookings = await getOwnerBookings(req.user._id);
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch host bookings'
    });
  }
};

// @desc Cancel booking
// @route PATCH /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await updateBookingStatus(req.params.id, 'cancelled', reason || 'Cancelled by user');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to cancel booking'
    });
  }
};

// @desc Accept or reject booking (Homeowner)
// @route PATCH /api/bookings/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be confirmed, rejected, or completed'
      });
    }

    const updated = await updateBookingStatus(req.params.id, status, reason);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: `Booking has been ${status}`,
      booking: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update booking status'
    });
  }
};
