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
      <div class="macos-vehicle-marker ${isAttention ? "attention" : "normal"}">
        <div class="marker-beacon"></div>
        <div class="marker-capsule">
          <span class="status-indicator-dot"></span>
          <span class="marker-title">${vehicleId}</span>
        </div>
      </div>
    `,
    iconSize: [64, 30],
    iconAnchor: [32, 15],
    popupAnchor: [0, -16],
  });
}

function createPopupContent(vehicle, status) {
  const isAttention = status === "Attention";
  const updatedTime = vehicle.timestamp
    ? new Date(vehicle.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

  const activeAlerts = [];
  if (vehicle.battery <= 20) {
    activeAlerts.push(`Low Battery Alert (${vehicle.battery}%)`);
  }
  if (vehicle.temperature >= 80) {
    activeAlerts.push(`High Temperature Warning (${vehicle.temperature}°C)`);
  }

  return `
    <div class="macos-popup">
      <div class="popup-top">
        <div class="popup-title-area">
          <span class="popup-id">${vehicle.vehicleId}</span>
          <span class="popup-badge ${isAttention ? "badge-attention" : "badge-active"}">
            ${status}
          </span>
        </div>
        <span class="popup-time">${updatedTime}</span>
      </div>

      <div class="popup-metrics-grid">
        <div class="popup-metric">
          <span class="m-label">Battery</span>
          <span class="m-val ${vehicle.battery <= 20 ? "m-warn" : ""}">${vehicle.battery}%</span>
        </div>
        <div class="popup-metric">
          <span class="m-label">Engine Temp</span>
          <span class="m-val ${vehicle.temperature >= 80 ? "m-danger" : ""}">${vehicle.temperature}°C</span>
        </div>
        <div class="popup-metric">
          <span class="m-label">Speed</span>
          <span class="m-val">${vehicle.speed} km/h</span>
        </div>
        <div class="popup-metric">
          <span class="m-label">Coordinates</span>
          <span class="m-val-sm">${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}</span>
        </div>
      </div>

      ${
        activeAlerts.length > 0
          ? `
        <div class="popup-warnings">
          ${activeAlerts
            .map((alertText) => `<div class="warning-pill">${alertText}</div>`)
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

export default function FleetMap({ vehicles = [], selectedVehicleId = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // 1. Initialize map on mount using 100% free OpenStreetMap (NO API KEY required)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([28.62, 77.215], 13);

    // Zoom controls bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Standard OpenStreetMap - completely free, no API key needed
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // ResizeObserver ensures map redraws without grey boxes when dimensions adjust
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
        existingMarker.setLatLng([vehicle.latitude, vehicle.longitude]);
        existingMarker.setIcon(icon);

        const popup = existingMarker.getPopup();
        if (popup) {
          popup.setContent(popupHtml);
        }
      } else {
        const marker = L.marker([vehicle.latitude, vehicle.longitude], {
          icon,
        }).addTo(map);

        marker.bindPopup(popupHtml, {
          closeButton: true,
          offset: [0, -10],
          className: "macos-leaflet-popup",
        });

        markersRef.current[vehicle.vehicleId] = marker;
      }
    });

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

  return (
    <div className="fleet-map-wrapper">
      <div className="fleet-map-container" ref={mapContainerRef} />
    </div>
  );
}
