const http = require('http');
const { startServer } = require('./src/server');

function apiCall(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

function divider(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`📌 ${title}`);
  console.log('='.repeat(60));
}

async function runLiveSimulation() {
  const server = await startServer();
  const PORT = 5000;
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // STEP 1: CREATE FAKE HOMEOWNER
    // ----------------------------------------------------
    divider('STEP 1: CREATING FAKE HOMEOWNER USER');
    const hostPayload = {
      name: 'Ananya Krishnan',
      email: `ananya.host.${timestamp}@wattstop.in`,
      phone: '+91 98410 98765',
      password: 'SecurePassword@123',
      role: 'homeowner'
    };
    console.log('Registering Homeowner Account:');
    console.log(JSON.stringify(hostPayload, null, 2));

    const hostReg = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      hostPayload
    );

    console.log(`\nResponse HTTP Status: ${hostReg.status}`);
    console.log('Created User Response:', JSON.stringify(hostReg.body.user, null, 2));
    const hostToken = hostReg.body.token;

    // ----------------------------------------------------
    // STEP 2: HOMEOWNER LISTS A REAL EV CHARGER
    // ----------------------------------------------------
    divider('STEP 2: HOMEOWNER PUBLISHES A CHARGER ON THE MAP');
    const chargerPayload = {
      name: "Ananya's Besant Nagar Solar Plug",
      description: 'Clean shaded driveway with 11kW Type 2 wallbox. 100% solar backed with CCTV security.',
      address: '24, 2nd Avenue, Besant Nagar',
      city: 'Chennai',
      latitude: 13.0001,
      longitude: 80.2699,
      acDcType: 'AC',
      connectorType: 'Type 2',
      capacityKw: 11,
      numberOfConnectors: 1,
      isFree: false,
      pricing: { pricePerKwh: 16, pricePerHour: 40, pricePerSession: 100 },
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      availableSlots: [{ startTime: '07:00', endTime: '23:00' }],
      instructions: 'Gate is unlocked during daylight. Ring doorbell for water or WiFi password.'
    };
    console.log('Publishing Charger Payload:');
    console.log(JSON.stringify(chargerPayload, null, 2));

    const chargerRes = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/chargers',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hostToken}`
        }
      },
      chargerPayload
    );

    console.log(`\nResponse HTTP Status: ${chargerRes.status}`);
    console.log('Saved Charger Details in Database:');
    console.log(JSON.stringify(chargerRes.body.charger, null, 2));
    const publishedChargerId = chargerRes.body.charger._id;

    // ----------------------------------------------------
    // STEP 3: CREATE FAKE EV DRIVER
    // ----------------------------------------------------
    divider('STEP 3: CREATING FAKE EV DRIVER USER');
    const driverPayload = {
      name: 'Vikram Chandran',
      email: `vikram.driver.${timestamp}@wattstop.in`,
      phone: '+91 97910 12345',
      password: 'SecurePassword@123',
      role: 'driver',
      vehicle: {
        make: 'Hyundai',
        model: 'Ioniq 5',
        batteryCapacityKw: 72.6,
        connectorType: 'CCS'
      }
    };
    console.log('Registering EV Driver Account:');
    console.log(JSON.stringify(driverPayload, null, 2));

    const driverReg = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      driverPayload
    );

    console.log(`\nResponse HTTP Status: ${driverReg.status}`);
    console.log('Created Driver Profile:', JSON.stringify(driverReg.body.user, null, 2));
    const driverToken = driverReg.body.token;

    // ----------------------------------------------------
    // STEP 4: DRIVER SEARCHES FOR NEARBY CHARGERS
    // ----------------------------------------------------
    divider('STEP 4: DRIVER SEARCHES NEARBY CHARGERS VIA GEOLOCATION');
    // Driver is at Adyar (lat: 13.0067, lng: 80.2575)
    console.log('Driver GPS Coordinates: Latitude 13.0067, Longitude 80.2575 (Adyar)');
    const searchRes = await apiCall({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/chargers/nearby?lat=13.0067&lng=80.2575&radius=15',
      method: 'GET'
    });

    console.log(`Found ${searchRes.body.count} chargers within 15 km:`);
    searchRes.body.chargers.forEach((c, idx) => {
      console.log(`  [#${idx + 1}] ${c.name} | ${c.address} | Dist: ${c.distanceKm} km | Rate: ${c.isFree ? 'Free' : `₹${c.pricing?.pricePerKwh}/kWh`}`);
    });

    // ----------------------------------------------------
    // STEP 5: DRIVER CHECKS AVAILABILITY & BOOKS A SLOT
    // ----------------------------------------------------
    divider('STEP 5: DRIVER CHECKS AVAILABILITY & BOOKS 2-HOUR CHARGING SLOT');
    const today = new Date().toISOString().split('T')[0];
    const availCheck = await apiCall({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/bookings/check-availability?chargerId=${publishedChargerId}&date=${today}&startTime=15:00&endTime=17:00`,
      method: 'GET'
    });

    console.log(`Checking slot 15:00 - 17:00 on ${today}:`);
    console.log('Availability Response:', availCheck.body);

    const bookingPayload = {
      chargerId: publishedChargerId,
      date: today,
      startTime: '15:00',
      endTime: '17:00',
      vehicleInfo: 'Hyundai Ioniq 5'
    };
    console.log('\nSubmitting Booking Request:');
    console.log(JSON.stringify(bookingPayload, null, 2));

    const bookRes = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      bookingPayload
    );

    console.log(`\nResponse HTTP Status: ${bookRes.status}`);
    console.log('Booking Confirmed:');
    console.log(JSON.stringify(bookRes.body.booking, null, 2));
    const bookingId = bookRes.body.booking._id;

    // ----------------------------------------------------
    // STEP 6: TEST DOUBLE-BOOKING PREVENTION
    // ----------------------------------------------------
    divider('STEP 6: TESTING ATOMIC DOUBLE-BOOKING CONFLICT PREVENTION');
    console.log('Attempting to book overlapping slot (16:00 - 18:00) on the same charger...');
    const conflictRes = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      {
        chargerId: publishedChargerId,
        date: today,
        startTime: '16:00',
        endTime: '18:00',
        vehicleInfo: 'Tata Nexon EV'
      }
    );

    console.log(`HTTP Status: ${conflictRes.status} (Expected 400 Bad Request)`);
    console.log('System Conflict Message:', conflictRes.body.message);

    // ----------------------------------------------------
    // STEP 7: HOMEOWNER VIEWS INCOMING RESERVATION
    // ----------------------------------------------------
    divider('STEP 7: HOMEOWNER DASHBOARD - VIEWING DRIVER RESERVATION');
    const hostRequests = await apiCall({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/bookings/host-requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${hostToken}` }
    });

    console.log(`Homeowner has ${hostRequests.body.count} booking request(s):`);
    hostRequests.body.bookings.forEach((b) => {
      console.log(`  Driver: ${b.driver?.name} (${b.driver?.phone})`);
      console.log(`  Vehicle: ${b.vehicleInfo}`);
      console.log(`  Slot: ${b.date} from ${b.startTime} to ${b.endTime}`);
      console.log(`  Total: ₹${b.totalAmount} | Status: ${b.status}`);
    });

    // ----------------------------------------------------
    // STEP 8: SARVAM AI VOICE COMMANDS (TAMIL & ENGLISH)
    // ----------------------------------------------------
    divider('STEP 8: TESTING SARVAM AI VOICE ASSISTANT IN TAMIL & ENGLISH');

    console.log('1. Voice Command: "Enakku nearby charging station thedu"');
    const voiceTamil = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/voice/process',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { text: 'Enakku nearby charging station thedu', lat: 13.0067, lng: 80.2575 }
    );
    console.log(`  Detected Language: ${voiceTamil.body.language}`);
    console.log(`  Detected Intent:   ${voiceTamil.body.intent}`);
    console.log(`  Spoken Response:   ${voiceTamil.body.responseText}`);

    console.log('\n2. Voice Command: "Show me free chargers"');
    const voiceEng = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/voice/process',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { text: 'Show me free chargers', lat: 13.0067, lng: 80.2575 }
    );
    console.log(`  Detected Language: ${voiceEng.body.language}`);
    console.log(`  Detected Intent:   ${voiceEng.body.intent}`);
    console.log(`  Spoken Response:   ${voiceEng.body.responseText}`);

    console.log('\n3. Voice Command: "Show my upcoming bookings"');
    const voiceBookings = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/voice/process',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { text: 'Show my upcoming bookings', lat: 13.0067, lng: 80.2575 }
    );
    console.log(`  Detected Language: ${voiceBookings.body.language}`);
    console.log(`  Detected Intent:   ${voiceBookings.body.intent}`);
    console.log(`  Spoken Response:   ${voiceBookings.body.responseText}`);

    // ----------------------------------------------------
    // STEP 9: DRIVER CANCELS THE BOOKING
    // ----------------------------------------------------
    divider('STEP 9: DRIVER CANCELS BOOKING');
    const cancelRes = await apiCall(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api/bookings/${bookingId}/cancel`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { reason: 'Trip rescheduled for tomorrow' }
    );
    console.log(`Cancellation Status: ${cancelRes.body.booking?.status}`);
    console.log(`Cancellation Reason: "${cancelRes.body.booking?.cancellationReason}"`);

    divider('🎉 LIVE SIMULATION TEST COMPLETED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('Simulation Error:', err);
  } finally {
    server.close(() => process.exit(0));
  }
}

runLiveSimulation();
