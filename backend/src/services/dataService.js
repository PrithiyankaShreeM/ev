const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { isMongoConnected, getLocalData, saveLocalData } = require('../config/db');
const User = require('../models/User');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const VoiceLog = require('../models/VoiceLog');

// Haversine formula for calculating distance in km
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Convert slot string "HH:mm" to minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Check time overlap between two intervals [s1, e1) and [s2, e2)
function hasTimeOverlap(startA, endA, startB, endB) {
  const minAStart = timeToMinutes(startA);
  const minAEnd = timeToMinutes(endA);
  const minBStart = timeToMinutes(startB);
  const minBEnd = timeToMinutes(endB);
  return Math.max(minAStart, minBStart) < Math.min(minAEnd, minBEnd);
}

// =================== USER OPERATIONS ===================
async function createUser(userData) {
  if (isMongoConnected()) {
    const user = new User(userData);
    return await user.save();
  }

  const data = getLocalData();
  const existing = data.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existing) {
    throw new Error('User already exists with this email address');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const newUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: userData.name,
    email: userData.email.toLowerCase(),
    phone: userData.phone,
    password: hashedPassword,
    role: userData.role || 'driver',
    vehicle: userData.vehicle || {
      make: '',
      model: '',
      batteryCapacityKw: 50,
      connectorType: 'Type 2'
    },
    avatar: userData.avatar || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.users.push(newUser);
  saveLocalData(data);
  return newUser;
}

async function findUserByEmail(email, includePassword = false) {
  if (isMongoConnected()) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return await query;
  }

  const data = getLocalData();
  const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (!includePassword) {
    const { password, ...rest } = user;
    return rest;
  }
  return user;
}

async function findUserById(id) {
  if (isMongoConnected()) {
    return await User.findById(id).select('-password');
  }

  const data = getLocalData();
  const user = data.users.find((u) => u._id.toString() === id.toString());
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

async function updateUser(id, updates) {
  if (isMongoConnected()) {
    return await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
  }

  const data = getLocalData();
  const idx = data.users.findIndex((u) => u._id.toString() === id.toString());
  if (idx === -1) return null;

  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(updates.password, salt);
  }

  data.users[idx] = {
    ...data.users[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveLocalData(data);

  const { password, ...safeUser } = data.users[idx];
  return safeUser;
}

// =================== CHARGER OPERATIONS ===================
async function createCharger(chargerData) {
  if (isMongoConnected()) {
    const charger = new Charger(chargerData);
    return await charger.save();
  }

  const data = getLocalData();
  const newCharger = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...chargerData,
    status: chargerData.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.chargers.push(newCharger);
  saveLocalData(data);
  return newCharger;
}

async function getChargers(filter = {}) {
  if (isMongoConnected()) {
    return await Charger.find(filter).populate('owner', 'name email phone avatar');
  }

  const data = getLocalData();
  let results = [...data.chargers];

  if (filter.status) {
    results = results.filter((c) => c.status === filter.status);
  }
  if (filter.acDcType) {
    results = results.filter((c) => c.acDcType === filter.acDcType);
  }
  if (filter.connectorType) {
    results = results.filter((c) => c.connectorType === filter.connectorType);
  }
  if (filter.isFree !== undefined) {
    results = results.filter((c) => Boolean(c.isFree) === Boolean(filter.isFree));
  }
  if (filter.owner) {
    results = results.filter((c) => c.owner.toString() === filter.owner.toString());
  }

  // Populate owner info
  return results.map((c) => {
    const ownerId = (c.owner?._id || c.owner)?.toString();
    const ownerObj = data.users.find((u) => u._id.toString() === ownerId);
    return {
      ...c,
      owner: ownerObj ? { _id: ownerObj._id, name: ownerObj.name, email: ownerObj.email, phone: ownerObj.phone } : c.owner
    };
  });
}

async function getChargerById(id) {
  if (isMongoConnected()) {
    return await Charger.findById(id).populate('owner', 'name email phone avatar');
  }

  const data = getLocalData();
  const charger = data.chargers.find((c) => c._id.toString() === id.toString());
  if (!charger) return null;

  const ownerId = (charger.owner?._id || charger.owner)?.toString();
  const ownerObj = data.users.find((u) => u._id.toString() === ownerId);
  return {
    ...charger,
    owner: ownerObj ? { _id: ownerObj._id, name: ownerObj.name, email: ownerObj.email, phone: ownerObj.phone } : charger.owner
  };
}

async function updateCharger(id, updates) {
  if (isMongoConnected()) {
    return await Charger.findByIdAndUpdate(id, updates, { new: true }).populate('owner', 'name email phone avatar');
  }

  const data = getLocalData();
  const idx = data.chargers.findIndex((c) => c._id.toString() === id.toString());
  if (idx === -1) return null;

  data.chargers[idx] = {
    ...data.chargers[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveLocalData(data);
  return data.chargers[idx];
}

async function findNearbyChargers(userLng, userLat, maxDistanceKm = 50, filters = {}) {
  const all = await getChargers({ status: 'active', ...filters });

  const withDistances = all.map((charger) => {
    const [cLng, cLat] = charger.location.coordinates;
    const distanceKm = haversineDistanceKm(userLat, userLng, cLat, cLng);
    return {
      ...(charger.toObject ? charger.toObject() : charger),
      distanceKm
    };
  });

  return withDistances
    .filter((c) => c.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

async function findChargersAlongRoute(routeCoordinates, corridorKm = 3.5, filters = {}) {
  // routeCoordinates is an array of [lng, lat] points from OSRM
  const all = await getChargers({ status: 'active', ...filters });

  if (!routeCoordinates || routeCoordinates.length === 0) {
    return all;
  }

  // Sample route points to keep calculation fast (e.g. at most 100 sample points)
  const step = Math.max(1, Math.floor(routeCoordinates.length / 80));
  const sampled = [];
  for (let i = 0; i < routeCoordinates.length; i += step) {
    sampled.push(routeCoordinates[i]);
  }
  // Ensure start and destination are included
  if (sampled[sampled.length - 1] !== routeCoordinates[routeCoordinates.length - 1]) {
    sampled.push(routeCoordinates[routeCoordinates.length - 1]);
  }

  const matched = [];

  for (const charger of all) {
    const [cLng, cLat] = charger.location.coordinates;
    let minDistance = Infinity;

    for (const [rLng, rLat] of sampled) {
      const dist = haversineDistanceKm(rLat, rLng, cLat, cLng);
      if (dist < minDistance) {
        minDistance = dist;
      }
      if (dist <= corridorKm) {
        break; // Within corridor
      }
    }

    if (minDistance <= corridorKm) {
      matched.push({
        ...(charger.toObject ? charger.toObject() : charger),
        distanceFromRouteKm: Number(minDistance.toFixed(2))
      });
    }
  }

  return matched.sort((a, b) => a.distanceFromRouteKm - b.distanceFromRouteKm);
}

// =================== BOOKING OPERATIONS ===================
async function checkSlotAvailability(chargerId, date, startTime, endTime) {
  let existingBookings = [];

  if (isMongoConnected()) {
    existingBookings = await Booking.find({
      charger: chargerId,
      date: date,
      status: { $in: ['confirmed', 'pending'] }
    });
  } else {
    const data = getLocalData();
    existingBookings = data.bookings.filter(
      (b) =>
        b.charger.toString() === chargerId.toString() &&
        b.date === date &&
        (b.status === 'confirmed' || b.status === 'pending')
    );
  }

  for (const b of existingBookings) {
    if (hasTimeOverlap(startTime, endTime, b.startTime, b.endTime)) {
      return {
        available: false,
        conflictingBooking: {
          startTime: b.startTime,
          endTime: b.endTime
        }
      };
    }
  }

  return { available: true };
}

async function createBooking(bookingData) {
  // 1. Verify availability to prevent double-booking
  const avail = await checkSlotAvailability(
    bookingData.charger,
    bookingData.date,
    bookingData.startTime,
    bookingData.endTime
  );

  if (!avail.available) {
    throw new Error(
      `Slot conflict: this charger is already booked between ${avail.conflictingBooking.startTime} and ${avail.conflictingBooking.endTime} on ${bookingData.date}`
    );
  }

  if (isMongoConnected()) {
    const booking = new Booking(bookingData);
    return await booking.save();
  }

  const data = getLocalData();
  const newBooking = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...bookingData,
    status: bookingData.status || 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.bookings.push(newBooking);
  saveLocalData(data);
  return newBooking;
}

async function getDriverBookings(driverId) {
  if (isMongoConnected()) {
    return await Booking.find({ driver: driverId })
      .populate('charger')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
  }

  const data = getLocalData();
  const list = data.bookings
    .filter((b) => b.driver.toString() === driverId.toString())
    .map((b) => {
      const charger = data.chargers.find((c) => c._id.toString() === b.charger.toString());
      const owner = data.users.find((u) => u._id.toString() === b.owner.toString());
      return {
        ...b,
        charger,
        owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : null
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return list;
}

async function getOwnerBookings(ownerId) {
  if (isMongoConnected()) {
    return await Booking.find({ owner: ownerId })
      .populate('charger')
      .populate('driver', 'name email phone vehicle')
      .sort({ createdAt: -1 });
  }

  const data = getLocalData();
  const list = data.bookings
    .filter((b) => {
      const bOwnerId = (b.owner?._id || b.owner)?.toString();
      return bOwnerId && bOwnerId === ownerId.toString();
    })
    .map((b) => {
      const chargerId = (b.charger?._id || b.charger)?.toString();
      const driverId = (b.driver?._id || b.driver)?.toString();
      const charger = data.chargers.find((c) => c._id.toString() === chargerId);
      const driver = data.users.find((u) => u._id.toString() === driverId);
      return {
        ...b,
        charger,
        driver: driver ? { name: driver.name, email: driver.email, phone: driver.phone, vehicle: driver.vehicle } : null
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return list;
}

async function updateBookingStatus(bookingId, status, reason = '') {
  if (isMongoConnected()) {
    return await Booking.findByIdAndUpdate(
      bookingId,
      { status, cancellationReason: reason },
      { new: true }
    );
  }

  const data = getLocalData();
  const idx = data.bookings.findIndex((b) => b._id.toString() === bookingId.toString());
  if (idx === -1) return null;

  data.bookings[idx] = {
    ...data.bookings[idx],
    status,
    cancellationReason: reason,
    updatedAt: new Date().toISOString()
  };
  saveLocalData(data);
  return data.bookings[idx];
}

// =================== VOICE LOGGING ===================
async function logVoiceCommand(logData) {
  if (isMongoConnected()) {
    const log = new VoiceLog(logData);
    return await log.save();
  }

  const data = getLocalData();
  const newLog = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...logData,
    createdAt: new Date().toISOString()
  };
  data.voiceLogs.push(newLog);
  saveLocalData(data);
  return newLog;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  createCharger,
  getChargers,
  getChargerById,
  updateCharger,
  findNearbyChargers,
  findChargersAlongRoute,
  checkSlotAvailability,
  createBooking,
  getDriverBookings,
  getOwnerBookings,
  updateBookingStatus,
  logVoiceCommand,
  haversineDistanceKm
};
