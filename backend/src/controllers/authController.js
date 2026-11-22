const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail, findUserById, updateUser } = require('../services/dataService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'wattstop_dev_secret_key_8b9ee45_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc Register new user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, vehicle } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const user = await createUser({
      name,
      email,
      phone,
      password,
      role: role === 'homeowner' ? 'homeowner' : 'driver',
      vehicle: vehicle || {
        make: '',
        model: '',
        batteryCapacityKw: 50,
        connectorType: 'Type 2'
      }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        vehicle: user.vehicle
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during registration'
    });
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        vehicle: user.vehicle
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during login'
    });
  }
};

// @desc Get current logged in user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve profile'
    });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, vehicle, password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (vehicle) updates.vehicle = vehicle;
    if (password && password.length >= 6) updates.password = password;

    const updatedUser = await updateUser(req.user._id, updates);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update profile'
    });
  }
};

// @desc Logout user
// @route POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
