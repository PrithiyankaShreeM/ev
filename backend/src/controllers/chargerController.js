const {
  createCharger,
  getChargers,
  getChargerById,
  updateCharger,
  findNearbyChargers,
  findChargersAlongRoute
} = require('../services/dataService');

// @desc Register new charger (Homeowner)
// @route POST /api/chargers
exports.createCharger = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      latitude,
      longitude,
      acDcType,
      connectorType,
      capacityKw,
      numberOfConnectors,
      photos,
      instructions,
      isFree,
      pricing,
      availableDays,
      availableSlots
    } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, and valid map coordinates (latitude/longitude) are required'
      });
    }

    const charger = await createCharger({
      owner: req.user._id,
      name,
      description: description || '',
      address,
      city: city || 'Chennai',
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      acDcType: acDcType || 'AC',
      connectorType: connectorType || 'Type 2',
      capacityKw: Number(capacityKw) || 7.4,
      numberOfConnectors: Number(numberOfConnectors) || 1,
      photos: photos || [
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80'
      ],
      instructions: instructions || 'Ring the bell upon arrival. Driveway access is clear.',
      isFree: Boolean(isFree),
      pricing: {
        pricePerKwh: isFree ? 0 : Number(pricing?.pricePerKwh ?? 15),
        pricePerHour: isFree ? 0 : Number(pricing?.pricePerHour ?? 40),
        pricePerSession: isFree ? 0 : Number(pricing?.pricePerSession ?? 100)
      },
      availableDays: availableDays || [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      availableSlots: availableSlots || [
        { startTime: '08:00', endTime: '22:00' }
      ],
      status: 'active'
    });

    res.status(201).json({
      success: true,
      charger
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to register charger'
    });
  }
};

// @desc Get all chargers with filters
// @route GET /api/chargers
exports.getChargers = async (req, res) => {
  try {
    const { acDcType, connectorType, isFree, minCapacity, maxPrice } = req.query;
    const filter = { status: 'active' };

    if (acDcType) filter.acDcType = acDcType;
    if (connectorType) filter.connectorType = connectorType;
    if (isFree !== undefined) filter.isFree = isFree === 'true';

    let chargers = await getChargers(filter);

    if (minCapacity) {
      chargers = chargers.filter((c) => c.capacityKw >= Number(minCapacity));
    }
    if (maxPrice && !filter.isFree) {
      chargers = chargers.filter((c) => c.isFree || (c.pricing?.pricePerKwh ?? 0) <= Number(maxPrice));
    }

    res.json({
      success: true,
      count: chargers.length,
      chargers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch chargers'
    });
  }
};

// @desc Get single charger by ID
// @route GET /api/chargers/:id
exports.getChargerById = async (req, res) => {
  try {
    const charger = await getChargerById(req.params.id);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found'
      });
    }
    res.json({
      success: true,
      charger
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch charger details'
    });
  }
};

// @desc Find nearby chargers based on coordinates
// @route GET /api/chargers/nearby
exports.getNearbyChargers = async (req, res) => {
  try {
    const { lat, lng, radius = 50, acDcType, connectorType, isFree, maxPrice } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user latitude and longitude coordinates'
      });
    }

    const filters = {};
    if (acDcType) filters.acDcType = acDcType;
    if (connectorType) filters.connectorType = connectorType;
    if (isFree !== undefined) filters.isFree = isFree === 'true';

    let nearby = await findNearbyChargers(Number(lng), Number(lat), Number(radius), filters);

    if (maxPrice && !filters.isFree) {
      nearby = nearby.filter((c) => c.isFree || (c.pricing?.pricePerKwh ?? 0) <= Number(maxPrice));
    }

    res.json({
      success: true,
      userLocation: { lat: Number(lat), lng: Number(lng) },
      count: nearby.length,
      chargers: nearby
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to search nearby chargers'
    });
  }
};

// @desc Find chargers along a calculated route
// @route POST /api/chargers/along-route
exports.getChargersAlongRoute = async (req, res) => {
  try {
    const { routeCoordinates, corridorKm = 3.5, acDcType, connectorType, isFree } = req.body;

    if (!routeCoordinates || !Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'routeCoordinates array of [lng, lat] is required'
      });
    }

    const filters = {};
    if (acDcType) filters.acDcType = acDcType;
    if (connectorType) filters.connectorType = connectorType;
    if (isFree !== undefined) filters.isFree = Boolean(isFree);

    const chargers = await findChargersAlongRoute(routeCoordinates, Number(corridorKm), filters);

    res.json({
      success: true,
      corridorKm: Number(corridorKm),
      count: chargers.length,
      chargers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to search chargers along route'
    });
  }
};

// @desc Get homeowner's own listings
// @route GET /api/chargers/my-listings
exports.getMyListings = async (req, res) => {
  try {
    const chargers = await getChargers({ owner: req.user._id });
    res.json({
      success: true,
      count: chargers.length,
      chargers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch your listings'
    });
  }
};

// @desc Update charger listing
// @route PUT /api/chargers/:id
exports.updateCharger = async (req, res) => {
  try {
    const charger = await getChargerById(req.params.id);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found'
      });
    }

    // Verify ownership
    const ownerId = charger.owner?._id || charger.owner;
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this charger'
      });
    }

    const updates = { ...req.body };
    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      updates.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
      };
    }

    const updated = await updateCharger(req.params.id, updates);

    res.json({
      success: true,
      charger: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update charger'
    });
  }
};

// @desc Toggle active/inactive status
// @route PATCH /api/chargers/:id/toggle-status
exports.toggleStatus = async (req, res) => {
  try {
    const charger = await getChargerById(req.params.id);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found'
      });
    }

    const ownerId = charger.owner?._id || charger.owner;
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const newStatus = charger.status === 'active' ? 'inactive' : 'active';
    const updated = await updateCharger(req.params.id, { status: newStatus });

    res.json({
      success: true,
      message: `Charger is now ${newStatus}`,
      charger: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to toggle status'
    });
  }
};
