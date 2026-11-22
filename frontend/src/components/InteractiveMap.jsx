import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function InteractiveMap({
  chargers = [],
  userLocation = null,
  destinationLocation = null,
  routeCoordinates = [],
  selectedCharger = null,
  onSelectCharger = () => {},
  onBookCharger = () => {},
  isPickerMode = false,
  pickerLocation = null,
  onPickLocation = () => {},
  height = '420px',
  isNavigating = false,
  onStopNavigation = () => {}
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const pickerMarkerRef = useRef(null);
  const navMarkerRef = useRef(null);

  const [simProgress, setSimProgress] = useState(0);
  const animFrameRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [13.0827, 80.2707];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {};
  }, []);

  // Handle map click for coordinate picker mode (Homeowner charger registration)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (isPickerMode) {
        onPickLocation(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPickerMode, onPickLocation]);

  // Update Route Polyline
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    const map = mapInstanceRef.current;
    if (!routeLayer || !map) return;

    routeLayer.clearLayers();

    if (routeCoordinates && routeCoordinates.length > 0) {
      const latLngs = routeCoordinates.map(([lng, lat]) => [lat, lng]);

      // Route line styling with shadow effect
      L.polyline(latLngs, {
        color: '#047857',
        weight: 7,
        opacity: 0.4,
        lineJoin: 'round'
      }).addTo(routeLayer);

      const mainLine = L.polyline(latLngs, {
        color: '#10b981',
        weight: 5,
        opacity: 0.95,
        lineJoin: 'round'
      }).addTo(routeLayer);

      if (!isNavigating) {
        map.fitBounds(mainLine.getBounds(), { padding: [50, 50] });
      }
    }
  }, [routeCoordinates, isNavigating]);

  // Turn-by-Turn GPS Navigation Simulation along Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isNavigating || !routeCoordinates || routeCoordinates.length < 2) {
      if (navMarkerRef.current) {
        navMarkerRef.current.remove();
        navMarkerRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    // Convert route to [lat, lng]
    const latLngs = routeCoordinates.map(([lng, lat]) => [lat, lng]);
    let currentIndex = 0;
    let progress = 0;

    const carIcon = L.divIcon({
      className: '',
      html: `
        <div style="background:#252b24;color:#b9ee45;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:18px;border:3px solid #b9ee45;box-shadow:0 0 15px rgba(185,238,69,0.8);transform:scale(1.1);">
          🚘
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    if (!navMarkerRef.current) {
      navMarkerRef.current = L.marker(latLngs[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
    }

    let lastTime = performance.now();

    const animateMovement = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      // Speed: advance index smoothly
      currentIndex += delta * 0.008;

      if (currentIndex >= latLngs.length - 1) {
        currentIndex = latLngs.length - 1;
        if (navMarkerRef.current) {
          navMarkerRef.current.setLatLng(latLngs[currentIndex]);
        }
        setSimProgress(100);
        return;
      }

      const lowerIdx = Math.floor(currentIndex);
      const upperIdx = Math.min(lowerIdx + 1, latLngs.length - 1);
      const ratio = currentIndex - lowerIdx;

      const curLat = latLngs[lowerIdx][0] + (latLngs[upperIdx][0] - latLngs[lowerIdx][0]) * ratio;
      const curLng = latLngs[lowerIdx][1] + (latLngs[upperIdx][1] - latLngs[lowerIdx][1]) * ratio;

      if (navMarkerRef.current) {
        navMarkerRef.current.setLatLng([curLat, curLng]);
      }

      // Smooth pan map following vehicle (Google Maps style)
      map.panTo([curLat, curLng], { animate: true, duration: 0.1 });
      setSimProgress(Math.round((currentIndex / (latLngs.length - 1)) * 100));

      animFrameRef.current = requestAnimationFrame(animateMovement);
    };

    animFrameRef.current = requestAnimationFrame(animateMovement);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isNavigating, routeCoordinates]);

  // Update Picker Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode && pickerLocation) {
      if (!pickerMarkerRef.current) {
        const pickerIcon = L.divIcon({
          className: '',
          html: `<div style="background:#ea580c;color:#fff;width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);display:grid;place-items:center;font-size:18px;font-weight:900;border:2px solid #fff;box-shadow:0 4px 12px rgba(234,88,12,0.5);"><span style="transform:rotate(45deg);">📍</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34]
        });

        pickerMarkerRef.current = L.marker([pickerLocation.lat, pickerLocation.lng], {
          icon: pickerIcon,
          draggable: true
        }).addTo(map);

        pickerMarkerRef.current.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onPickLocation(latlng.lat, latlng.lng);
        });
      } else {
        pickerMarkerRef.current.setLatLng([pickerLocation.lat, pickerLocation.lng]);
      }
      map.panTo([pickerLocation.lat, pickerLocation.lng]);
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, pickerLocation, onPickLocation]);

  // Update Charger & User Markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersLayer || !map) return;

    markersLayer.clearLayers();

    // 1. User Location Pin
    if (userLocation && !isNavigating) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div class="user-gps-pin" title="Your Live Location"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup('<strong>You are here</strong><br><small>GPS Detection</small>')
        .addTo(markersLayer);
    }

    // 2. Destination Pin
    if (destinationLocation) {
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="background:#ef4444;color:#fff;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:14px;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.3);">🏁</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([destinationLocation.lat, destinationLocation.lng], { icon: destIcon })
        .bindPopup(`<strong>Destination</strong><br><small>${destinationLocation.name || 'End Point'}</small>`)
        .addTo(markersLayer);
    }

    // 3. Charger Pins
    chargers.forEach((charger) => {
      const [lng, lat] = charger.location?.coordinates || [80.2707, 13.0827];
      const isSelected = selectedCharger && selectedCharger._id === charger._id;

      const pinIcon = L.divIcon({
        className: '',
        html: `<div class="custom-ev-pin ${isSelected ? 'scale-125 ring-4 ring-lime-400' : ''}" style="${charger.isFree ? 'background:#15803d;' : ''}"><span>ϟ</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const priceText = charger.isFree ? 'Free to charge' : `₹${charger.pricing?.pricePerKwh || 15} / kWh`;
      const distanceBadge = charger.distanceKm ? ` · ${charger.distanceKm} km away` : '';

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans';
      popupContent.innerHTML = `
        <div style="font-weight:700;font-size:13px;color:#20251f;">${charger.name}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">${charger.address}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:10px;font-weight:700;">
          <span style="background:#eef2e6;color:#3f6212;padding:2px 6px;border-radius:4px;">${charger.connectorType}</span>
          <span style="background:#f3f4f6;color:#374151;padding:2px 6px;border-radius:4px;">${charger.capacityKw} kW</span>
          <span style="background:#f0fdf4;color:#166534;padding:2px 6px;border-radius:4px;">${priceText}</span>
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:4px;">${distanceBadge}</div>
        <button id="book-btn-${charger._id}" style="margin-top:8px;width:100%;background:#b9ee45;color:#1f2918;border:0;border-radius:4px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;">
          Book Slot ↗
        </button>
      `;

      const marker = L.marker([lat, lng], { icon: pinIcon })
        .bindPopup(popupContent)
        .addTo(markersLayer);

      marker.on('click', () => {
        onSelectCharger(charger);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`book-btn-${charger._id}`);
        if (btn) {
          btn.onclick = () => onBookCharger(charger);
        }
      });
    });

    if (selectedCharger && selectedCharger.location?.coordinates && !isNavigating) {
      const [sLng, sLat] = selectedCharger.location.coordinates;
      map.setView([sLat, sLng], 14, { animate: true });
    }
  }, [chargers, userLocation, destinationLocation, selectedCharger, isNavigating]);

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', minHeight: '300px' }}
        className="rounded-lg overflow-hidden border border-[#eceee9] relative z-0"
      />

      {/* Live Turn-by-Turn HUD Overlay (like Google Maps) */}
      {isNavigating && (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-[#252b24]/95 text-white p-3.5 rounded-lg shadow-2xl backdrop-blur-md border border-lime-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-lg animate-pulse">
              🧭
            </div>
            <div>
              <div className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-2">
                <span>Google Maps Style Live Navigation</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
              </div>
              <div className="text-sm font-extrabold mt-0.5">
                En Route to {destinationLocation?.name || 'Selected Destination'}
              </div>
              <div className="text-[10px] text-gray-300">
                Route Progress: {simProgress}% · Map auto-tracking vehicle GPS position
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onStopNavigation}
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
            >
              Exit Navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
