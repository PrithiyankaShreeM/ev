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

// Charger registration & management endpoints
router.post('/', protect, createCharger);
router.get('/host/my-listings', protect, getMyListings);
router.put('/:id', protect, updateCharger);
router.patch('/:id/toggle-status', protect, toggleStatus);

module.exports = router;
