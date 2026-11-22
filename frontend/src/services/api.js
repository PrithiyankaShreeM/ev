const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getHeaders(token, isMultipart = false) {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const authToken = token || localStorage.getItem('wattstop_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const isMultipart = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(options.token, isMultipart),
      ...options.headers
    }
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

// Auth API
export const authApi = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
};

// Chargers API
export const chargerApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/chargers${query ? `?${query}` : ''}`);
  },
  getNearby: (lat, lng, radius = 50, filters = {}) => {
    const query = new URLSearchParams({ lat, lng, radius, ...filters }).toString();
    return request(`/chargers/nearby?${query}`);
  },
  getAlongRoute: (routeCoordinates, corridorKm = 3.5, filters = {}) =>
    request('/chargers/along-route', {
      method: 'POST',
      body: JSON.stringify({ routeCoordinates, corridorKm, ...filters })
    }),
  getById: (id) => request(`/chargers/${id}`),
  create: (chargerData) =>
    request('/chargers', {
      method: 'POST',
      body: JSON.stringify(chargerData)
    }),
  getMyListings: () => request('/chargers/host/my-listings'),
  update: (id, updates) =>
    request(`/chargers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  toggleStatus: (id) =>
    request(`/chargers/${id}/toggle-status`, {
      method: 'PATCH'
    })
};

// Bookings API
export const bookingApi = {
  checkAvailability: (chargerId, date, startTime, endTime) => {
    const query = new URLSearchParams({ chargerId, date, startTime, endTime }).toString();
    return request(`/bookings/check-availability?${query}`);
  },
  create: (bookingData) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),
  getMyBookings: () => request('/bookings/my-bookings'),
  getHostRequests: () => request('/bookings/host-requests'),
  cancel: (id, reason) =>
    request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    }),
  updateStatus: (id, status, reason) =>
    request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    })
};

// Voice API
export const voiceApi = {
  processCommand: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request('/voice/process', {
      method: 'POST',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  }
};

// Map Geocoding & Routing Services (Nominatim & OSRM)
export const mapApi = {
  geocodeSearch: async (query) => {
    if (!query || query.trim().length < 2) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=in`,
        {
          headers: { 'User-Agent': 'WattStop-EV-Platform/2.0' }
        }
      );
      return await res.json();
    } catch (e) {
      console.warn('Geocode search failed', e);
      return [];
    }
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: { 'User-Agent': 'WattStop-EV-Platform/2.0' }
        }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (e) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  },

  calculateRoute: async (startLng, startLat, destLng, destLat) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distanceKm: Number((route.distance / 1000).toFixed(1)),
          durationMinutes: Math.round(route.duration / 60),
          coordinates: route.geometry.coordinates // Array of [lng, lat]
        };
      }
      return null;
    } catch (e) {
      console.warn('OSRM Route calculation failed', e);
      return null;
    }
  }
};
