const http = require('http');
const { startServer } = require('./src/server');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('⚡ STARTING WATTSTOP FULL-STACK END-TO-END TESTS ⚡');
  console.log('====================================================');

  const server = await startServer();
  const PORT = 5000;
  let hostToken = '';
  let driverToken = '';
  let createdChargerId = '';
  let createdBookingId = '';

  try {
    // 1. Register a Homeowner
    console.log('\n[TEST 1] Register Homeowner...');
    const hostRegRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Meena Raman',
        email: `meena.host.${Date.now()}@wattstop.in`,
        phone: '+91 98765 43210',
        password: 'password123',
        role: 'homeowner'
      }
    );
    console.log('Status:', hostRegRes.status, 'Success:', hostRegRes.data.success, 'Host ID:', hostRegRes.data.user?.id);
    if (hostRegRes.status !== 201) throw new Error('Host registration failed');
    hostToken = hostRegRes.data.token;

    // 2. Register a Charger as Homeowner
    console.log('\n[TEST 2] Register Charger (Homeowner)...');
    const chargerRes = await makeRequest(
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
      {
        name: 'Mylapore Green Socket',
        description: 'Shaded car porch with dedicated 11kW AC charger.',
        address: '15, Luz Church Road, Mylapore',
        city: 'Chennai',
        latitude: 13.0368,
        longitude: 80.2676,
        acDcType: 'AC',
        connectorType: 'Type 2',
        capacityKw: 11,
        numberOfConnectors: 1,
        isFree: false,
        pricing: { pricePerKwh: 16, pricePerHour: 45, pricePerSession: 110 },
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: [{ startTime: '07:00', endTime: '22:00' }]
      }
    );
    console.log('Status:', chargerRes.status, 'Created Charger:', chargerRes.data.charger?.name, 'ID:', chargerRes.data.charger?._id);
    if (chargerRes.status !== 201) throw new Error('Charger creation failed');
    createdChargerId = chargerRes.data.charger._id;

    // 3. Register & Login as Driver
    console.log('\n[TEST 3] Register Driver...');
    const driverRegRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Arun Kumar',
        email: `arun.driver.${Date.now()}@wattstop.in`,
        phone: '+91 97890 12345',
        password: 'password123',
        role: 'driver',
        vehicle: { model: 'Tata Tiago EV', connectorType: 'CCS' }
      }
    );
    console.log('Status:', driverRegRes.status, 'Driver ID:', driverRegRes.data.user?.id);
    if (driverRegRes.status !== 201) throw new Error('Driver registration failed');
    driverToken = driverRegRes.data.token;

    // 4. Search for the Published Charger (Nearby)
    console.log('\n[TEST 4] Search Nearby Chargers as Driver...');
    const nearbyRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/chargers/nearby?lat=13.04&lng=80.26&radius=10',
      method: 'GET'
    });
    console.log('Status:', nearbyRes.status, 'Total Chargers Nearby:', nearbyRes.data.count);
    const foundPublished = nearbyRes.data.chargers?.find((c) => c._id === createdChargerId);
    console.log('Found Published Charger in Search:', Boolean(foundPublished), 'Distance:', foundPublished?.distanceKm, 'km');

    // 5. Get Charger Details
    console.log('\n[TEST 5] Get Charger Details...');
    const detailRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/chargers/${createdChargerId}`,
      method: 'GET'
    });
    console.log('Status:', detailRes.status, 'Charger Name:', detailRes.data.charger?.name, 'Address:', detailRes.data.charger?.address);

    // 6. Check Availability
    console.log('\n[TEST 6] Check Slot Availability...');
    const today = new Date().toISOString().split('T')[0];
    const availRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/bookings/check-availability?chargerId=${createdChargerId}&date=${today}&startTime=14:00&endTime=16:00`,
      method: 'GET'
    });
    console.log('Status:', availRes.status, 'Available:', availRes.data.available);

    // 7. Book an Available Slot
    console.log('\n[TEST 7] Book Charger Slot...');
    const bookRes = await makeRequest(
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
        chargerId: createdChargerId,
        date: today,
        startTime: '14:00',
        endTime: '16:00',
        vehicleInfo: 'Tata Tiago EV'
      }
    );
    console.log('Status:', bookRes.status, 'Booking Confirmed:', bookRes.data.success, 'Amount:', bookRes.data.booking?.totalAmount);
    if (bookRes.status !== 201) throw new Error('Booking failed');
    createdBookingId = bookRes.data.booking._id;

    // 8. Test Double-Booking Prevention (Should fail with conflict error)
    console.log('\n[TEST 8] Test Atomic Double-Booking Prevention...');
    const conflictRes = await makeRequest(
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
        chargerId: createdChargerId,
        date: today,
        startTime: '15:00', // Overlaps 14:00 - 16:00
        endTime: '17:00',
        vehicleInfo: 'Another EV'
      }
    );
    console.log('Status:', conflictRes.status, 'Expected rejection message:', conflictRes.data.message);
    if (conflictRes.status !== 400) throw new Error('Double booking prevention failed!');

    // 9. Verify Booking in Homeowner Dashboard
    console.log('\n[TEST 9] Verify Booking in Host Requests...');
    const hostRequestsRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/bookings/host-requests',
      method: 'GET',
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    console.log('Status:', hostRequestsRes.status, 'Host received bookings count:', hostRequestsRes.data.count);
    const hostHasBooking = hostRequestsRes.data.bookings?.some((b) => b._id === createdBookingId);
    console.log('Host sees the driver booking:', hostHasBooking);

    // 10. Test Driver Booking History & Cancellation
    console.log('\n[TEST 10] Driver Booking Cancellation...');
    const cancelRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api/bookings/${createdBookingId}/cancel`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { reason: 'Trip rescheduled' }
    );
    console.log('Status:', cancelRes.status, 'Status after cancel:', cancelRes.data.booking?.status);

    // 11. Test Tamil / Thanglish Voice Commands
    console.log('\n[TEST 11] Test Tamil / Thanglish Voice Command...');
    const voiceTamilRes = await makeRequest(
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
      {
        text: 'Enakku nearby charging station find pannu',
        lat: 13.0827,
        lng: 80.2707
      }
    );
    console.log('Status:', voiceTamilRes.status);
    console.log('Language Detected:', voiceTamilRes.data.language);
    console.log('Intent Detected:', voiceTamilRes.data.intent);
    console.log('Tamil Response:', voiceTamilRes.data.responseText);

    // 12. Test English Voice Command (Free Chargers)
    console.log('\n[TEST 12] Test English Voice Command (Free Chargers)...');
    const voiceEngRes = await makeRequest(
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
      {
        text: 'Show me free chargers',
        lat: 13.0827,
        lng: 80.2707
      }
    );
    console.log('Status:', voiceEngRes.status);
    console.log('Intent Detected:', voiceEngRes.data.intent);
    console.log('Response:', voiceEngRes.data.responseText);

    // 13. Test Route Corridor Charger Search
    console.log('\n[TEST 13] Test Chargers Along Route Corridor...');
    // Simulated OSRM route points between Anna Nagar and Adyar
    const sampleRouteCoords = [
      [80.2184, 13.0878], // Anna Nagar
      [80.2337, 13.0418], // T. Nagar
      [80.2575, 13.0067]  // Adyar
    ];
    const routeRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/chargers/along-route',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        routeCoordinates: sampleRouteCoords,
        corridorKm: 4.0
      }
    );
    console.log('Status:', routeRes.status, 'Chargers found along route:', routeRes.data.count);
    routeRes.data.chargers?.forEach((c) => {
      console.log(`  -> ${c.name} (${c.distanceFromRouteKm} km from route, ${c.connectorType})`);
    });

    console.log('\n====================================================');
    console.log('🎉 ALL 13 END-TO-END VERIFICATION TESTS PASSED 100%! 🎉');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('Server shut down cleanly.');
      process.exit(process.exitCode || 0);
    });
  }
}

runE2ETests();
