const express = require('express');
const router = express.Router();
const {
  createCharger,
  getChargers,
  getChargerById,
  getNearbyChargers,
  getChargersAlongRoute,
  getMyListings,
  updateCharger,
  toggleStatus
} = require('../controllers/chargerController');
const { protect, authorize } = require('../middleware/auth');

// Public search endpoints
router.get('/', getChargers);
router.get('/nearby', getNearbyChargers);
router.post('/along-route', getChargersAlongRoute);
router.get('/:id', getChargerById);

// Protected Homeowner management endpoints
router.post('/', protect, authorize('homeowner'), createCharger);
router.get('/host/my-listings', protect, authorize('homeowner'), getMyListings);
router.put('/:id', protect, authorize('homeowner'), updateCharger);
router.patch('/:id/toggle-status', protect, authorize('homeowner'), toggleStatus);

module.exports = router;
