import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./FleetMap.css";

function getVehicleStatus(vehicle) {
  if (vehicle.battery <= 20 || vehicle.temperature >= 80) {
    return "Attention";
  }
  return "Active";
}

function createVehicleIcon(vehicleId, isAttention) {
  return L.divIcon({
    className: "pulseops-marker-wrapper",
    html: `
      <div class="custom-vehicle-marker ${isAttention ? "attention" : "normal"}">
        <div class="marker-pulse"></div>
        <div class="marker-bubble">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
            <path d="M15 18H9"></path>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.49-4.36A1 1 0 0 0 17.51 8H14v10Z"></path>
            <circle cx="17" cy="18" r="2"></circle>
            <circle cx="7" cy="18" r="2"></circle>
          </svg>
          <span class="marker-id">${vehicleId}</span>
        </div>
      </div>
    `,
    iconSize: [60, 34],
    iconAnchor: [30, 17],
    popupAnchor: [0, -18],
  });
}

function createPopupContent(vehicle, status) {
  const isAttention = status === "Attention";
  const updatedTime = vehicle.timestamp
    ? new Date(vehicle.timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  return `
    <div class="pulseops-popup">
      <div class="popup-header">
        <div class="popup-title">
          <span class="popup-vehicle-id">${vehicle.vehicleId}</span>
          <span class="popup-status-badge ${isAttention ? "badge-attention" : "badge-active"}">
            ${status}
          </span>
        </div>
        <span class="popup-time">${updatedTime}</span>
      </div>

      <div class="popup-stats-grid">
        <div class="popup-stat-item">
          <span class="stat-label">Battery</span>
          <span class="stat-value ${vehicle.battery <= 20 ? "stat-warn" : ""}">${vehicle.battery}%</span>
        </div>
        <div class="popup-stat-item">
          <span class="stat-label">Temperature</span>
          <span class="stat-value ${vehicle.temperature >= 80 ? "stat-warn" : ""}">${vehicle.temperature}°C</span>
        </div>
        <div class="popup-stat-item">
          <span class="stat-label">Speed</span>
          <span class="stat-value">${vehicle.speed} km/h</span>
        </div>
        <div class="popup-stat-item">
          <span class="stat-label">Coordinates</span>
          <span class="stat-value-sm">${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}</span>
        </div>
      </div>
    </div>
  `;
}

export default function FleetMap({ vehicles = [], selectedVehicleId = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // 1. Initialize map on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center on Delhi region matching the simulated coordinates
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([28.62, 77.215], 13);

    // OpenStreetMap standard tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Resize handling to prevent grey tiles if container dimensions change
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // 2. Synchronize markers whenever vehicles array updates via Socket.IO
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentVehicleIds = new Set();

    vehicles.forEach((vehicle) => {
      if (
        typeof vehicle.latitude !== "number" ||
        typeof vehicle.longitude !== "number"
      ) {
        return;
      }

      currentVehicleIds.add(vehicle.vehicleId);
      const status = getVehicleStatus(vehicle);
      const isAttention = status === "Attention";
      const icon = createVehicleIcon(vehicle.vehicleId, isAttention);
      const popupHtml = createPopupContent(vehicle, status);

      const existingMarker = markersRef.current[vehicle.vehicleId];

      if (existingMarker) {
        // Smoothly update location and content without recreating marker
        existingMarker.setLatLng([vehicle.latitude, vehicle.longitude]);
        existingMarker.setIcon(icon);

        const popup = existingMarker.getPopup();
        if (popup) {
          popup.setContent(popupHtml);
        }
      } else {
        // Create new marker
        const marker = L.marker([vehicle.latitude, vehicle.longitude], {
          icon,
        }).addTo(map);

        marker.bindPopup(popupHtml, {
          closeButton: true,
          offset: [0, -10],
        });

        markersRef.current[vehicle.vehicleId] = marker;
      }
    });

    // Clean up markers for removed vehicles
    Object.keys(markersRef.current).forEach((vId) => {
      if (!currentVehicleIds.has(vId)) {
        markersRef.current[vId].remove();
        delete markersRef.current[vId];
      }
    });
  }, [vehicles]);

  // 3. Pan to selected vehicle if requested
  useEffect(() => {
    if (!selectedVehicleId || !mapInstanceRef.current) return;
    const targetMarker = markersRef.current[selectedVehicleId];
    if (targetMarker) {
      const latLng = targetMarker.getLatLng();
      mapInstanceRef.current.flyTo(latLng, 14, { duration: 0.8 });
      targetMarker.openPopup();
    }
  }, [selectedVehicleId]);

  return <div className="fleet-map-container" ref={mapContainerRef} />;
}
