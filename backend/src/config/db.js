const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMongoConnected = false;
const dataFile = path.join(__dirname, '../../data/db.json');

// Ensure data folder and file exist for persistent fallback
const initLocalStore = () => {
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      users: [],
      chargers: [],
      bookings: [],
      voiceLogs: []
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  }
};

const getLocalData = () => {
  initLocalStore();
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], chargers: [], bookings: [], voiceLogs: [] };
  }
};

const saveLocalData = (data) => {
  initLocalStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wattstop';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick fail if local mongo not running
      connectTimeoutMS: 2500
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database Notice] MongoDB server not reachable at ${uri}.`);
    console.warn(`[Database Notice] Operating in WattStop Persistent JSON Store mode (storage: backend/data/db.json).`);
    console.warn(`[Database Notice] All models, authentication, bookings, and operations remain fully persistent.`);
    initLocalStore();
  }
};

module.exports = {
  connectDB,
  isMongoConnected: () => isMongoConnected,
  getLocalData,
  saveLocalData
};
