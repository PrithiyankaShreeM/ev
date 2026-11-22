require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const seedDatabase = require('./seed');

const authRoutes = require('./routes/authRoutes');
const chargerRoutes = require('./routes/chargerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'WattStop EV Home Charging Platform',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/voice', voiceRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server and Connect DB
async function startServer() {
  await connectDB();
  // Auto-seed initial data if needed
  try {
    await seedDatabase();
  } catch (seedErr) {
    console.warn('[Seed Warning]', seedErr.message);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`⚡ WattStop Backend Server running on port ${PORT}`);
    console.log(`⚡ REST API URL: http://localhost:${PORT}/api`);
    console.log(`⚡ Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
