import React, { useState, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import { chargerApi, mapApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DriverDashboard({
  onSelectCharger,
  onBookCharger,
  onViewBookings,
  onOpenHowItWorks
}) {
  const { user } = useAuth();

  // Location and Route States
  const [userLocation, setUserLocation] = useState({ lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu' });
  const [destinationInput, setDestinationInput] = useState('');
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Route calculation
  const [routeData, setRouteData] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Charger list and filters
  const [chargers, setChargers] = useState([]);
  const [isLoadingChargers, setIsLoadingChargers] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState(null);

  // Filter States
  const [acDcFilter, setAcDcFilter] = useState('');
  const [connectorFilter, setConnectorFilter] = useState('');
  const [onlyFree, setOnlyFree] = useState(false);
  const [minCapacity, setMinCapacity] = useState('');
  const [maxPrice, setMaxPrice] = useState(50);
  const [searchCorridorKm, setSearchCorridorKm] = useState(5);

  // Fetch chargers based on current location and active filters
  const fetchChargers = async () => {
    setIsLoadingChargers(true);
    try {
      const filters = {};
      if (acDcFilter) filters.acDcType = acDcFilter;
      if (connectorFilter) filters.connectorType = connectorFilter;
      if (onlyFree) filters.isFree = true;
      if (minCapacity) filters.minCapacity = minCapacity;
      if (maxPrice && !onlyFree) filters.maxPrice = maxPrice;

      if (routeData && routeData.coordinates?.length > 0) {
        // Find along route
        const res = await chargerApi.getAlongRoute(routeData.coordinates, searchCorridorKm, filters);
        setChargers(res.chargers || []);
      } else {
        // Find nearby
        const res = await chargerApi.getNearby(userLocation.lat, userLocation.lng, 35, filters);
        setChargers(res.chargers || []);
      }
    } catch (err) {
      console.error('Failed to fetch chargers', err);
    } finally {
      setIsLoadingChargers(false);
    }
  };

  useEffect(() => {
    fetchChargers();
  }, [userLocation, routeData, acDcFilter, connectorFilter, onlyFree, minCapacity, maxPrice]);

  // Request GPS Permission and detect location
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await mapApi.reverseGeocode(latitude, longitude);
        setUserLocation({ lat: latitude, lng: longitude, name });
        setIsGpsLoading(false);
      },
      (err) => {
        console.warn('GPS permission denied or unavailable, keeping default location.', err);
        setIsGpsLoading(false);
        alert('Could not access GPS. Please allow location permissions or enter location manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Destination autocomplete search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (destinationInput.trim().length >= 3) {
        setIsSearchingDest(true);
        const results = await mapApi.geocodeSearch(destinationInput);
        setDestinationSuggestions(results);
        setIsSearchingDest(false);
      } else {
        setDestinationSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [destinationInput]);

  // Select destination and calculate route
  const handleSelectDestination = async (item) => {
    const dest = {
      lat: Number(item.lat),
      lng: Number(item.lon),
      name: item.display_name.split(',')[0]
    };
    setDestinationLocation(dest);
    setDestinationInput(dest.name);
    setDestinationSuggestions([]);

    // Calculate OSRM route
    setIsCalculatingRoute(true);
    const route = await mapApi.calculateRoute(userLocation.lng, userLocation.lat, dest.lng, dest.lat);
    if (route) {
      setRouteData(route);
    } else {
      alert('Unable to calculate driving route to that destination.');
    }
    setIsCalculatingRoute(false);
  };

  // Clear route
  const handleClearRoute = () => {
    setDestinationInput('');
    setDestinationLocation(null);
    setRouteData(null);
  };

  return (
    <section id="driver-view" className="animate-fadeIn">
      {/* Hero Grid from Reference */}
      <div className="hero-grid">
        <div className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span>✳</span> MADE FOR THE ROAD AHEAD
            </span>
            <h2>
              Find your next<br />good stop<span>.</span>
            </h2>
            <p>Discover a more personal way to charge. Find home chargers near you or along your route.</p>
            <a className="primary-button" href="#route-planner">
              Plan route & explore <span>↗</span>
            </a>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="art-card">
              <span>THE POWER OF</span>
              <strong>
                plugging<br />in locally<span>.</span>
              </strong>
              <div className="art-bottom">
                <span>WATTSTOP COMMUNITY</span>
                <b>ϟ</b>
              </div>
            </div>
            <div className="art-spark">✳</div>
          </div>

          <div className="hero-index">01 / THE JOURNEY STARTS HERE</div>
        </div>

        <div className="side-card flex flex-col justify-between">
          <div>
            <div className="section-top">
              <span className="mini-label">YOUR JOURNEY</span>
              <span className="circle-arrow">↗</span>
            </div>
            <div className="side-icon">⌁</div>
            <h3>Where to next?</h3>
            <p>Plan an EV trip and discover verified residential charging points along your drive.</p>
          </div>
          <a className="text-link" href="#route-planner">
            Start journey search <span>→</span>
          </a>
        </div>
      </div>

      {/* Route & GPS Planner Card */}
      <div id="route-planner" className="mt-6 bg-white border border-[#eceee9] rounded-[9px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#f2f4ef]">
          <div>
            <span className="mini-label">NAVIGATION & GPS</span>
            <h3 className="text-lg font-bold font-display mt-1">Route-Based EV Charger Search</h3>
          </div>
          <button
            onClick={handleDetectGps}
            disabled={isGpsLoading}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-md bg-[#f0f3eb] hover:bg-[#e4ebdb] text-[#242b20] transition border border-[#dce3d5] self-start md:self-auto"
          >
            <span>📍</span> {isGpsLoading ? 'Detecting GPS...' : 'Use Current GPS Location'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Start Location */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Start Location
            </label>
            <div className="flex items-center bg-[#f8f9f6] border border-[#e1e5dd] rounded-md px-3 py-2">
              <span className="text-sm mr-2 text-lime-700">🟢</span>
              <input
                type="text"
                readOnly
                value={userLocation.name}
                className="bg-transparent text-xs w-full font-medium focus:outline-none text-gray-800"
              />
            </div>
          </div>

          {/* Destination Search with Autocomplete */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Destination Point
            </label>
            <div className="flex items-center bg-[#f8f9f6] border border-[#e1e5dd] rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-lime-400">
              <span className="text-sm mr-2 text-red-500">🏁</span>
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                placeholder="Search destination (e.g. Adyar, Velachery, Mahabalipuram)"
                className="bg-transparent text-xs w-full font-medium focus:outline-none text-gray-800 placeholder-gray-400"
              />
              {destinationLocation && (
                <button
                  onClick={handleClearRoute}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold ml-2"
                  title="Clear Route"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {destinationSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e1e5dd] rounded-md shadow-lg z-50 max-h-56 overflow-y-auto">
                {destinationSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectDestination(item)}
                    className="p-2.5 text-xs hover:bg-[#f0f3eb] cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-bold text-gray-800">{item.display_name.split(',')[0]}</div>
                    <div className="text-[10px] text-gray-500 truncate">{item.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calculated Route Info Pill */}
        {routeData && (
          <div className="mt-4 p-3.5 bg-[#f0f5e9] border border-[#ddebce] rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-500 text-[10px] block uppercase font-bold">Total Distance</span>
                <strong className="text-sm text-[#1f2918]">{routeData.distanceKm} km</strong>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <span className="text-gray-500 text-[10px] block uppercase font-bold">Estimated Drive Time</span>
                <strong className="text-sm text-[#1f2918]">{routeData.durationMinutes} mins</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lime-800 font-semibold text-xs">
                ⚡ Showing home chargers within {searchCorridorKm} km of route
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-[9px] border border-[#eceee9] text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-gray-600 mr-1">Filter:</span>

          {/* AC / DC */}
          <select
            value={acDcFilter}
            onChange={(e) => setAcDcFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-200 bg-[#f8f9f6] text-xs font-medium focus:outline-none"
          >
            <option value="">All Power Types</option>
            <option value="AC">AC Home Charging</option>
            <option value="DC">DC Fast Charging</option>
          </select>

          {/* Connector */}
          <select
            value={connectorFilter}
            onChange={(e) => setConnectorFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-200 bg-[#f8f9f6] text-xs font-medium focus:outline-none"
          >
            <option value="">All Connectors</option>
            <option value="Type 2">Type 2 (Standard)</option>
            <option value="CCS">CCS (Fast)</option>
            <option value="CHAdeMO">CHAdeMO</option>
            <option value="Type 1">Type 1</option>
          </select>

          {/* Free vs Paid Toggle */}
          <button
            onClick={() => setOnlyFree(!onlyFree)}
            className={`px-3 py-1.5 rounded border font-semibold transition ${
              onlyFree
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-[#f8f9f6] text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {onlyFree ? '✓ Free Chargers Only' : 'Free Chargers'}
          </button>
        </div>

        <div className="text-gray-500 font-medium">
          {chargers.length} {chargers.length === 1 ? 'charger' : 'chargers'} available
        </div>
      </div>

      {/* Section Heading from Reference */}
      <div className="section-heading" id="discover">
        <div>
          <div className="eyebrow muted">EXPLORE THE COMMUNITY</div>
          <h2>
            Charging, within reach<span className="green-dot">.</span>
          </h2>
          <p>
            {routeData
              ? `Displaying residential chargers along your ${routeData.distanceKm} km route.`
              : 'Real verified residential charging points around Chennai and Tamil Nadu.'}
          </p>
        </div>
        <span className="sample-tag">⚡ LIVE MONGODB NETWORK</span>
      </div>

      {/* Discover Grid (Interactive Map + Chargers List) */}
      <div className="discover-grid">
        {/* Interactive Leaflet Map */}
        <div className="map-card shadow-sm">
          <div className="map-header">
            <div>
              <strong>Interactive Network Map</strong>
              <small>Click any charger marker to inspect availability and book</small>
            </div>
            <span className="map-badge">LIVE LEAFLET / OSM</span>
          </div>

          <div className="p-2 bg-[#f8f9f6]">
            <InteractiveMap
              chargers={chargers}
              userLocation={userLocation}
              destinationLocation={destinationLocation}
              routeCoordinates={routeData?.coordinates || []}
              selectedCharger={selectedCharger}
              onSelectCharger={(charger) => setSelectedCharger(charger)}
              onBookCharger={(charger) => onBookCharger(charger)}
              height="380px"
            />
          </div>
        </div>

        {/* Chargers List */}
        <div className="list-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="list-heading">
              <div>
                <strong>Community Chargers</strong>
                <small>Residential hosts open for booking</small>
              </div>
              <span className="text-gray-400">↗</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f0f1ee]">
              {isLoadingChargers ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading chargers from database...</div>
              ) : chargers.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No chargers found matching your selected filters. Try broadening your criteria.
                </div>
              ) : (
                chargers.map((charger) => {
                  const isSelected = selectedCharger && selectedCharger._id === charger._id;
                  return (
                    <div
                      key={charger._id}
                      onClick={() => {
                        setSelectedCharger(charger);
                        onSelectCharger(charger);
                      }}
                      className={`charger ${isSelected ? 'bg-[#f0f5e9]' : ''}`}
                    >
                      <span className="charger-icon">ϟ</span>
                      <div className="flex-1 min-w-0 pr-2">
                        <strong className="truncate">{charger.name}</strong>
                        <small>
                          {charger.city || 'Chennai'} · {charger.connectorType} · {charger.capacityKw} kW
                          {charger.distanceKm ? ` · ${charger.distanceKm} km` : ''}
                          {charger.distanceFromRouteKm !== undefined
                            ? ` · ${charger.distanceFromRouteKm} km off route`
                            : ''}
                        </small>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="charger-price">
                          {charger.isFree ? (
                            <span className="text-green-700 font-bold">Free</span>
                          ) : (
                            <>
                              ₹{charger.pricing?.pricePerKwh ?? 15}
                              <small>/ kWh</small>
                            </>
                          )}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookCharger(charger);
                          }}
                          className="text-[10px] bg-[#baf04a] hover:bg-[#a9e637] text-[#1f2918] font-bold px-2 py-0.5 rounded transition"
                        >
                          Book ↗
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="list-foot border-t border-[#f0f1ee] pt-3">
            <span>Powered by WattStop Home Hosts</span>
            <span>{chargers.length} active stations ↗</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid Cards from Reference */}
      <div className="bottom-grid">
        <div className="bottom-card cursor-pointer hover:bg-gray-50 transition" onClick={onViewBookings}>
          <span className="bottom-icon">▣</span>
          <div>
            <span className="mini-label">YOUR BOOKINGS</span>
            <h3>Manage your charging stops</h3>
            <p>View upcoming reservations, active sessions, and booking history.</p>
          </div>
          <span className="bottom-arrow">↗</span>
        </div>

        <div
          className="bottom-card light-green cursor-pointer hover:brightness-95 transition"
          onClick={onOpenHowItWorks}
        >
          <span className="bottom-icon">✳</span>
          <div>
            <span className="mini-label">A BETTER WAY TO CHARGE</span>
            <h3>Powered by people.</h3>
            <p>Drivers and homeowners, connected through WattStop.</p>
          </div>
          <span className="bottom-arrow">↗</span>
        </div>
      </div>
    </section>
  );
}
