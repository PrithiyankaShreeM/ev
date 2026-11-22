import React, { useEffect, useRef } from 'react';
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
  height = '420px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Chennai center from reference UI
      const initialCenter = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [13.0827, 80.2707];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: true
      });

      // OpenStreetMap attribution tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Keep instance intact across renders, clean up on unmount
    };
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
    if (!routeLayer) return;

    routeLayer.clearLayers();

    if (routeCoordinates && routeCoordinates.length > 0) {
      // OSRM coordinates are [lng, lat], Leaflet expects [lat, lng]
      const latLngs = routeCoordinates.map(([lng, lat]) => [lat, lng]);

      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 5,
        opacity: 0.85,
        dashArray: null,
        lineJoin: 'round'
      }).addTo(routeLayer);

      const map = mapInstanceRef.current;
      if (map) {
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [routeCoordinates]);

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
    if (userLocation) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div class="user-gps-pin" title="Your Location"></div>`,
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
        html: `<div style="background:#ef4444;color:#fff;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:14px;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.3);">🏁</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
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

    // If a charger was specifically selected or zoomed into
    if (selectedCharger && selectedCharger.location?.coordinates) {
      const [sLng, sLat] = selectedCharger.location.coordinates;
      map.setView([sLat, sLng], 14, { animate: true });
    }
  }, [chargers, userLocation, destinationLocation, selectedCharger]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', minHeight: '300px' }}
      className="rounded-lg overflow-hidden border border-[#eceee9] relative z-0"
    />
  );
}
