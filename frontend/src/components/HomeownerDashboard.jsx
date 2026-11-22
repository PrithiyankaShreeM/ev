import React, { useState, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import { chargerApi, bookingApi, mapApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HomeownerDashboard({ onOpenAuth }) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'register' | 'listings' | 'requests'
  const [myListings, setMyListings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states for registering a new charger
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    acDcType: 'AC',
    connectorType: 'Type 2',
    capacityKw: 7.4,
    numberOfConnectors: 1,
    instructions: 'Drive into gate. The wallbox is on the left wall.',
    isFree: false,
    pricePerKwh: 15,
    pricePerHour: 40,
    pricePerSession: 100,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    startTime: '08:00',
    endTime: '22:00',
    photoUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80'
  });

  // Editing state
  const [editingChargerId, setEditingChargerId] = useState(null);

  // Fetch host data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [chargersRes, bookingsRes] = await Promise.all([
        chargerApi.getMyListings().catch(() => ({ chargers: [] })),
        bookingApi.getHostRequests().catch(() => ({ bookings: [] }))
      ]);
      setMyListings(chargersRes.chargers || []);
      setBookingRequests(bookingsRes.bookings || []);
    } catch (e) {
      console.warn('Failed to load homeowner data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle map coordinate picking
  const handlePickLocation = async (lat, lng) => {
    const address = await mapApi.reverseGeocode(lat, lng);
    setFormData((prev) => ({
      ...prev,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      address: address || prev.address
    }));
  };

  // Toggle available day checkbox
  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const exists = prev.availableDays.includes(day);
      return {
        ...prev,
        availableDays: exists
          ? prev.availableDays.filter((d) => d !== day)
          : [...prev.availableDays, day]
      };
    });
  };

  // Submit charger registration
  const handleSubmitCharger = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        acDcType: formData.acDcType,
        connectorType: formData.connectorType,
        capacityKw: Number(formData.capacityKw),
        numberOfConnectors: Number(formData.numberOfConnectors),
        photos: [formData.photoUrl],
        instructions: formData.instructions,
        isFree: formData.isFree,
        pricing: {
          pricePerKwh: formData.isFree ? 0 : Number(formData.pricePerKwh),
          pricePerHour: formData.isFree ? 0 : Number(formData.pricePerHour),
          pricePerSession: formData.isFree ? 0 : Number(formData.pricePerSession)
        },
        availableDays: formData.availableDays,
        availableSlots: [
          { startTime: formData.startTime, endTime: formData.endTime }
        ]
      };

      if (editingChargerId) {
        await chargerApi.update(editingChargerId, payload);
        setMessage({ type: 'success', text: 'Charger listing updated successfully!' });
      } else {
        await chargerApi.create(payload);
        setMessage({ type: 'success', text: 'Charger published live to WattStop network!' });
      }

      setEditingChargerId(null);
      await fetchData();
      setActiveTab('listings');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save charger listing' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle charger active/inactive
  const handleToggleStatus = async (chargerId) => {
    try {
      await chargerApi.toggleStatus(chargerId);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Could not toggle charger status');
    }
  };

  // Accept or reject booking
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingApi.updateStatus(bookingId, newStatus);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Could not update booking status');
    }
  };

  // Start editing existing charger
  const handleStartEdit = (charger) => {
    setEditingChargerId(charger._id);
    const [lng, lat] = charger.location?.coordinates || [80.2707, 13.0827];
    const firstSlot = charger.availableSlots?.[0] || { startTime: '08:00', endTime: '22:00' };

    setFormData({
      name: charger.name,
      description: charger.description || '',
      address: charger.address,
      city: charger.city || 'Chennai',
      latitude: lat,
      longitude: lng,
      acDcType: charger.acDcType || 'AC',
      connectorType: charger.connectorType || 'Type 2',
      capacityKw: charger.capacityKw || 7.4,
      numberOfConnectors: charger.numberOfConnectors || 1,
      instructions: charger.instructions || '',
      isFree: charger.isFree || false,
      pricePerKwh: charger.pricing?.pricePerKwh || 15,
      pricePerHour: charger.pricing?.pricePerHour || 40,
      pricePerSession: charger.pricing?.pricePerSession || 100,
      availableDays: charger.availableDays || [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ],
      startTime: firstSlot.startTime || '08:00',
      endTime: firstSlot.endTime || '22:00',
      photoUrl: charger.photos?.[0] || ''
    });
    setActiveTab('register');
  };

  if (!user) {
    return (
      <div className="bg-white border border-[#eceee9] rounded-[9px] p-8 text-center my-6">
        <div className="side-icon mx-auto">⌂</div>
        <h2 className="text-xl font-bold font-display">Homeowner Portal Access</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-2">
          Please sign in or create a Homeowner account to register chargers, manage availability, and accept driver bookings.
        </p>
        <button onClick={onOpenAuth} className="primary-button mt-5 mx-auto">
          Sign In as Homeowner <span>→</span>
        </button>
      </div>
    );
  }

  return (
    <section id="homeowner-view" className="animate-fadeIn">
      {/* Homeowner Hero from Reference */}
      <div className="owner-hero">
        <div className="relative z-10">
          <span className="hero-kicker">
            <span>✳</span> FOR THE COMMUNITY
          </span>
          <h2>
            Put your plug<br />to good use<span>.</span>
          </h2>
          <p>Share your home charger, earn supplementary income, and help someone get a little further.</p>
          <button
            className="primary-button"
            onClick={() => {
              setEditingChargerId(null);
              setActiveTab('register');
            }}
          >
            Add a charger <span>↗</span>
          </button>
        </div>
        <div className="owner-symbol" aria-hidden="true">
          ϟ
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-3 mt-6 border-b border-[#e1e5dd] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-lime-500 text-[#22291f]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Host Overview
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'listings'
              ? 'border-lime-500 text-[#22291f]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          My Listed Chargers ({myListings.length})
        </button>
        <button
          onClick={() => {
            setEditingChargerId(null);
            setActiveTab('register');
          }}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'register'
              ? 'border-lime-500 text-[#22291f]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          {editingChargerId ? 'Edit Charger' : '+ Register New Charger'}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'requests'
              ? 'border-lime-500 text-[#22291f]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Incoming Bookings ({bookingRequests.length})
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded text-xs flex justify-between items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div className="section-heading">
            <div>
              <div className="eyebrow muted">YOUR HOST SPACE</div>
              <h2>
                Make yourself at home<span className="green-dot">.</span>
              </h2>
              <p>Everything you need to manage your residential charging space.</p>
            </div>
            <span className="sample-tag">HOST DASHBOARD</span>
          </div>

          <div className="owner-grid">
            <div
              className="owner-card cursor-pointer hover:border-gray-400 transition"
              onClick={() => setActiveTab('listings')}
            >
              <span>01 / YOUR LISTINGS</span>
              <div className="owner-card-icon">⌂</div>
              <h3>
                {myListings.length > 0
                  ? `${myListings.length} Active Charger${myListings.length > 1 ? 's' : ''}`
                  : 'No chargers listed yet.'}
              </h3>
              <p>
                {myListings.length > 0
                  ? 'Your registered charging stations are live on the network.'
                  : 'Publish your driveway or garage wallbox to begin hosting.'}
              </p>
            </div>

            <div
              className="owner-card cursor-pointer hover:border-gray-400 transition"
              onClick={() => setActiveTab('listings')}
            >
              <span>02 / AVAILABILITY</span>
              <div className="owner-card-icon">◷</div>
              <h3>Your time, your rules.</h3>
              <p>Easily toggle active status or adjust available hours and days anytime.</p>
            </div>

            <div
              className="owner-card cursor-pointer hover:border-gray-400 transition"
              onClick={() => setActiveTab('requests')}
            >
              <span>03 / BOOKINGS</span>
              <div className="owner-card-icon">▣</div>
              <h3>{bookingRequests.length} Reservation Requests</h3>
              <p>Review incoming requests from drivers, confirm slots, and check logs.</p>
            </div>
          </div>
        </>
      )}

      {/* VIEW: REGISTER / EDIT CHARGER */}
      {activeTab === 'register' && (
        <div className="mt-6 bg-white border border-[#eceee9] rounded-[9px] p-6 shadow-sm">
          <div className="border-b border-[#f2f4ef] pb-4 mb-6">
            <span className="mini-label">CHARGER ONBOARDING</span>
            <h2 className="text-xl font-bold font-display mt-1">
              {editingChargerId ? 'Update Charger Listing' : 'Register a Charging Point'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Set exact map coordinates independently from your home address, configure connector types, and set pricing.
            </p>
          </div>

          <form onSubmit={handleSubmitCharger} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Basic Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Charger Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greenway Home Charge, Adyar Fast Plug"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description & Host Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe your parking setup, shading, CCTV, or accessibility notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Power Type *
                    </label>
                    <select
                      value={formData.acDcType}
                      onChange={(e) => setFormData({ ...formData, acDcType: e.target.value })}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:outline-none"
                    >
                      <option value="AC">AC Charging (Wallbox)</option>
                      <option value="DC">DC Fast Charging</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Connector Type *
                    </label>
                    <select
                      value={formData.connectorType}
                      onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:outline-none"
                    >
                      <option value="Type 2">Type 2 (AC European/Indian standard)</option>
                      <option value="CCS">CCS 2 (DC Fast standard)</option>
                      <option value="CHAdeMO">CHAdeMO</option>
                      <option value="Type 1">Type 1</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Charging Capacity (kW) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.capacityKw}
                      onChange={(e) => setFormData({ ...formData, capacityKw: e.target.value })}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Number of Connectors
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={formData.numberOfConnectors}
                      onChange={(e) => setFormData({ ...formData, numberOfConnectors: e.target.value })}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Street Address & Landmarks *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12, 4th Avenue, Anna Nagar East"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Charging Photo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-md focus:outline-none"
                  />
                </div>
              </div>

              {/* Right Column: Interactive Map Picker & Pricing */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Pin Exact Location on Map *
                    </label>
                    <span className="text-[10px] text-gray-500">Click map to move pin</span>
                  </div>

                  {/* Leaflet Picker Map */}
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <InteractiveMap
                      isPickerMode={true}
                      pickerLocation={{ lat: formData.latitude, lng: formData.longitude }}
                      onPickLocation={handlePickLocation}
                      height="200px"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-gray-500">
                    <div>Latitude: <strong className="text-gray-800">{formData.latitude}</strong></div>
                    <div>Longitude: <strong className="text-gray-800">{formData.longitude}</strong></div>
                  </div>
                </div>

                {/* Pricing Structure */}
                <div className="p-3 bg-[#f8f9f6] rounded-md border border-[#e1e5dd]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">Pricing Model</span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-green-700">
                      <input
                        type="checkbox"
                        checked={formData.isFree}
                        onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                      />
                      Offer Free Community Charging
                    </label>
                  </div>

                  {!formData.isFree && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold">₹ per kWh</label>
                        <input
                          type="number"
                          value={formData.pricePerKwh}
                          onChange={(e) => setFormData({ ...formData, pricePerKwh: e.target.value })}
                          className="w-full text-xs p-1.5 border border-gray-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold">₹ per Hour</label>
                        <input
                          type="number"
                          value={formData.pricePerHour}
                          onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                          className="w-full text-xs p-1.5 border border-gray-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold">₹ per Session</label>
                        <input
                          type="number"
                          value={formData.pricePerSession}
                          onChange={(e) => setFormData({ ...formData, pricePerSession: e.target.value })}
                          className="w-full text-xs p-1.5 border border-gray-200 rounded bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability Schedule */}
                <div className="p-3 bg-[#f8f9f6] rounded-md border border-[#e1e5dd]">
                  <span className="text-xs font-bold text-gray-700 block mb-2">Available Operating Hours</span>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-[10px] text-gray-500">Opens at</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full text-xs p-1.5 border border-gray-200 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500">Closes at</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full text-xs p-1.5 border border-gray-200 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const active = formData.availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`text-[10px] font-bold px-2 py-1 rounded transition ${
                            active ? 'bg-lime-400 text-black' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="primary-button"
              >
                {loading
                  ? 'Saving to MongoDB...'
                  : editingChargerId
                  ? 'Update Listing ↗'
                  : 'Publish Charger ↗'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Your Registered Chargers ({myListings.length})</h3>
            <button
              onClick={() => {
                setEditingChargerId(null);
                setActiveTab('register');
              }}
              className="text-xs bg-lime-400 hover:bg-lime-500 font-bold px-3 py-1.5 rounded transition text-black"
            >
              + Add Another Charger
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="p-8 bg-white border border-[#eceee9] rounded-[9px] text-center text-xs text-gray-500">
              You have not registered any chargers yet. Click '+ Add Another Charger' to publish your home plug.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myListings.map((charger) => (
                <div
                  key={charger._id}
                  className="bg-white border border-[#eceee9] rounded-[9px] p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{charger.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{charger.address}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        charger.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {charger.status === 'active' ? '● Active' : '○ Deactivated'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-700">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{charger.connectorType}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{charger.capacityKw} kW</span>
                    <span className="bg-lime-100 text-lime-900 px-2 py-0.5 rounded">
                      {charger.isFree ? 'Free' : `₹${charger.pricing?.pricePerKwh ?? 15} / kWh`}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleToggleStatus(charger._id)}
                      className={`font-bold transition ${
                        charger.status === 'active'
                          ? 'text-yellow-700 hover:text-yellow-900'
                          : 'text-green-700 hover:text-green-900'
                      }`}
                    >
                      {charger.status === 'active' ? 'Pause / Deactivate' : 'Reactivate Listing'}
                    </button>
                    <button
                      onClick={() => handleStartEdit(charger)}
                      className="font-bold text-gray-700 hover:text-black"
                    >
                      Edit Details ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="mt-6 space-y-4">
          <h3 className="font-bold text-sm">Driver Reservation Requests</h3>

          {bookingRequests.length === 0 ? (
            <div className="p-8 bg-white border border-[#eceee9] rounded-[9px] text-center text-xs text-gray-500">
              No booking requests received yet. When drivers reserve slots, they will appear here.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 bg-white border border-[#eceee9] rounded-[9px] overflow-hidden">
              {bookingRequests.map((b) => (
                <div key={b._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-gray-900">
                      {b.driver?.name || 'EV Driver'} ({b.driver?.phone || 'No phone'})
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      Reserved slot: <strong>{b.date}</strong> from <strong>{b.startTime}</strong> to <strong>{b.endTime}</strong>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Vehicle: {b.vehicleInfo || b.driver?.vehicle?.model || 'EV'} · Amount: {b.isFree ? 'Free' : `₹${b.totalAmount}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : b.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {b.status}
                    </span>

                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-2.5 py-1 rounded"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(b._id, 'rejected')}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold px-2.5 py-1 rounded"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateBookingStatus(b._id, 'completed')}
                        className="bg-gray-800 hover:bg-black text-white font-bold px-2.5 py-1 rounded text-[11px]"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
