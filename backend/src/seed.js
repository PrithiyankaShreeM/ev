require('dotenv').config();
const { connectDB } = require('./config/db');
const {
  createUser,
  findUserByEmail,
  createCharger,
  getChargers
} = require('./services/dataService');

async function seedDatabase() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  // 1. Create or ensure default Homeowner
  let host = await findUserByEmail('priya.host@wattstop.in');
  if (!host) {
    host = await createUser({
      name: 'Priya Sundaram',
      email: 'priya.host@wattstop.in',
      phone: '+91 98401 23456',
      password: 'password123',
      role: 'homeowner'
    });
    console.log('[Seed] Created default homeowner:', host.email);
  }

  // 2. Create or ensure default Driver
  let driver = await findUserByEmail('karthik.driver@wattstop.in');
  if (!driver) {
    driver = await createUser({
      name: 'Karthik Raja',
      email: 'karthik.driver@wattstop.in',
      phone: '+91 98402 34567',
      password: 'password123',
      role: 'driver',
      vehicle: {
        make: 'Tata',
        model: 'Nexon EV Max',
        batteryCapacityKw: 40.5,
        connectorType: 'CCS'
      }
    });
    console.log('[Seed] Created default driver:', driver.email);
  }

  // 3. Check existing chargers
  const existingChargers = await getChargers();
  if (existingChargers.length === 0) {
    const sampleChargers = [
      {
        owner: host._id,
        name: 'Greenway Home Charge',
        description: 'Dedicated wallbox charger in a quiet residential driveway. Clean shaded parking space with solar backup.',
        address: '12, 4th Avenue, Anna Nagar East',
        city: 'Chennai',
        location: {
          type: 'Point',
          coordinates: [80.2184, 13.0878] // [lng, lat]
        },
        acDcType: 'AC',
        connectorType: 'Type 2',
        capacityKw: 7.4,
        numberOfConnectors: 1,
        photos: [
          'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80'
        ],
        instructions: 'Drive into gate #12. The charger is on the left wall beside the portico. Ring bell for assistance.',
        isFree: false,
        pricing: {
          pricePerKwh: 15,
          pricePerHour: 40,
          pricePerSession: 100
        },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: [
          { startTime: '07:00', endTime: '22:00' }
        ],
        status: 'active'
      },
      {
        owner: host._id,
        name: 'The Corner Plug',
        description: 'Community-funded green charging point in Adyar. 100% solar powered and free for local EV drivers.',
        address: '28, Gandhi Nagar 1st Main Rd, Adyar',
        city: 'Chennai',
        location: {
          type: 'Point',
          coordinates: [80.2575, 13.0067]
        },
        acDcType: 'AC',
        connectorType: 'Type 2',
        capacityKw: 11,
        numberOfConnectors: 1,
        photos: [
          'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
        ],
        instructions: 'Corner bungalow with open gate. Plug in and send a quick message in the app.',
        isFree: true,
        pricing: {
          pricePerKwh: 0,
          pricePerHour: 0,
          pricePerSession: 0
        },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: [
          { startTime: '06:00', endTime: '23:00' }
        ],
        status: 'active'
      },
      {
        owner: host._id,
        name: 'Parkside Fast Charging',
        description: 'High capacity residential DC fast charger near Velachery Lake. Ideal for quick top-ups during daily commutes.',
        address: '45, 100 Feet Bypass Rd, Velachery',
        city: 'Chennai',
        location: {
          type: 'Point',
          coordinates: [80.2206, 12.9815]
        },
        acDcType: 'DC',
        connectorType: 'CCS',
        capacityKw: 50,
        numberOfConnectors: 2,
        photos: [
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
        ],
        instructions: 'Dedicated commercial-grade home unit. Parking space right in front of the gate.',
        isFree: false,
        pricing: {
          pricePerKwh: 20,
          pricePerHour: 80,
          pricePerSession: 200
        },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: [
          { startTime: '08:00', endTime: '21:00' }
        ],
        status: 'active'
      },
      {
        owner: host._id,
        name: 'Metro Pulse EV Hub',
        description: 'Convenient central Chennai charging spot right off Usman Road. 22kW fast AC charging with CCTV monitoring.',
        address: '14, North Usman Road, T. Nagar',
        city: 'Chennai',
        location: {
          type: 'Point',
          coordinates: [80.2337, 13.0418]
        },
        acDcType: 'AC',
        connectorType: 'Type 2',
        capacityKw: 22,
        numberOfConnectors: 1,
        photos: [
          'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80'
        ],
        instructions: 'Parking bay on the ground floor. Automated gate with QR scanner.',
        isFree: false,
        pricing: {
          pricePerKwh: 18,
          pricePerHour: 50,
          pricePerSession: 120
        },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: [
          { startTime: '08:00', endTime: '20:00' }
        ],
        status: 'active'
      },
      {
        owner: host._id,
        name: 'OMR Tech Corridor Fast Plug',
        description: 'High-speed DC charger along the Rajiv Gandhi IT Expressway. Easy highway access for OMR commuters.',
        address: '88, Rajiv Gandhi Salai, Thoraipakkam, OMR',
        city: 'Chennai',
        location: {
          type: 'Point',
          coordinates: [80.2343, 12.9366]
        },
        acDcType: 'DC',
        connectorType: 'CCS',
        capacityKw: 60,
        numberOfConnectors: 2,
        photos: [
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
        ],
        instructions: 'Near CTS building. Enter service lane, gated villa community on right.',
        isFree: false,
        pricing: {
          pricePerKwh: 22,
          pricePerHour: 90,
          pricePerSession: 220
        },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: [
          { startTime: '06:00', endTime: '23:00' }
        ],
        status: 'active'
      }
    ];

    for (const c of sampleChargers) {
      await createCharger(c);
    }
    console.log(`[Seed] Seeded ${sampleChargers.length} sample home chargers in Chennai.`);
  } else {
    console.log(`[Seed] Database already has ${existingChargers.length} chargers. Skipping sample insertion.`);
  }

  console.log('[Seed] Database initialization complete.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
