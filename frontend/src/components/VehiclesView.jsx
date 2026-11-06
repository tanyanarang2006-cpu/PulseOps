import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  Clock,
  Compass,
  ExternalLink,
  Filter,
  Flame,
  Gauge,
  MapPin,
  Radio,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import "./VehiclesView.css";

function getVehicleStatus(vehicle) {
  if (vehicle.battery <= 20 || vehicle.temperature >= 80) {
    return "Attention";
  }
  return "Active";
}

export default function VehiclesView({
  vehicles = [],
  onSelectVehicleForMap,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "ATTENTION"
  const [sortBy, setSortBy] = useState("id"); // "id" | "battery" | "temp" | "speed"
  const [inspectVehicleId, setInspectVehicleId] = useState(null);
  const [vehicleEvents, setVehicleEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Filter and sort vehicles
  const processedVehicles = useMemo(() => {
    let result = vehicles.filter((v) => {
      const status = getVehicleStatus(v);
      const matchesSearch =
        !searchQuery.trim() ||
        v.vehicleId.toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && status === "Active") ||
        (statusFilter === "ATTENTION" && status === "Attention");

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "battery") return a.battery - b.battery;
      if (sortBy === "temp") return b.temperature - a.temperature;
      if (sortBy === "speed") return b.speed - a.speed;
      return a.vehicleId.localeCompare(b.vehicleId);
    });

    return result;
  }, [vehicles, searchQuery, statusFilter, sortBy]);

  const inspectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.vehicleId === inspectVehicleId) || null;
  }, [vehicles, inspectVehicleId]);

  // Fetch individual vehicle events when inspected
  useEffect(() => {
    if (!inspectVehicleId) {
      setVehicleEvents([]);
      return;
    }

    let isMounted = true;
    setLoadingEvents(true);

    fetch(`http://localhost:5000/api/vehicles/${inspectVehicleId}/events`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed")))
      .then((json) => {
        if (isMounted) setVehicleEvents(json.data || []);
      })
      .catch((err) => console.error("Error fetching vehicle history:", err))
      .finally(() => {
        if (isMounted) setLoadingEvents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inspectVehicleId]);

  return (
    <div className="vehicles-view-container">
      {/* Top Filter and Search Controls */}
      <div className="vehicles-controls-card">
        <div className="search-group">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search vehicle ID (e.g. DEL-101)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery("")}
            >
              <XCircle size={15} />
            </button>
          )}
        </div>

        <div className="filter-chips">
          <button
            className={`filter-chip ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All Vehicles ({vehicles.length})
          </button>
          <button
            className={`filter-chip active-chip ${
              statusFilter === "ACTIVE" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("ACTIVE")}
          >
            Operational (
            {vehicles.filter((v) => getVehicleStatus(v) === "Active").length})
          </button>
          <button
            className={`filter-chip warn-chip ${
              statusFilter === "ATTENTION" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("ATTENTION")}
          >
            Needs Attention (
            {
              vehicles.filter((v) => getVehicleStatus(v) === "Attention")
                .length
            }
            )
          </button>
        </div>

        <div className="sort-group">
          <Filter size={14} />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="id">Vehicle ID</option>
            <option value="battery">Lowest Battery</option>
            <option value="temp">Highest Temperature</option>
            <option value="speed">Top Speed</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="vehicles-grid">
        {processedVehicles.map((vehicle) => {
          const status = getVehicleStatus(vehicle);
          const isAttention = status === "Attention";
          const isInspected = inspectVehicleId === vehicle.vehicleId;

          // Battery color calculation
          const batteryColor =
            vehicle.battery <= 20
              ? "#ef4444"
              : vehicle.battery <= 50
              ? "#f59e0b"
              : "#10b981";

          return (
            <div
              key={vehicle.vehicleId}
              className={`vehicle-card ${isAttention ? "needs-attention" : ""} ${
                isInspected ? "is-selected" : ""
              }`}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="vehicle-id-badge">
                  <div
                    className="v-icon"
                    style={
                      isAttention
                        ? { background: "#3d2217", color: "#ff9858" }
                        : {}
                    }
                  >
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3>{vehicle.vehicleId}</h3>
                    <span>DELIVERY VAN</span>
                  </div>
                </div>

                <span
                  className={`status-pill ${
                    isAttention ? "pill-warn" : "pill-active"
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Active Warning Banner if low battery or high temperature */}
              {(vehicle.battery <= 20 || vehicle.temperature >= 80) && (
                <div className="card-warning-banner">
                  {vehicle.battery <= 20 && (
                    <span className="warning-chip battery">
                      <Battery size={11} /> Low Battery ({vehicle.battery}%)
                    </span>
                  )}
                  {vehicle.temperature >= 80 && (
                    <span className="warning-chip temp">
                      <Flame size={11} /> Overheating ({vehicle.temperature}°C)
                    </span>
                  )}
                </div>
              )}

              {/* Telemetry Gauge Bars */}
              <div className="metrics-block">
                {/* Battery Bar */}
                <div className="metric-row">
                  <div className="metric-label">
                    <span className="label-title">
                      <Battery size={13} /> Battery Level
                    </span>
                    <strong style={{ color: batteryColor }}>
                      {vehicle.battery}%
                    </strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, vehicle.battery))}%`,
                        backgroundColor: batteryColor,
                      }}
                    />
                  </div>
                </div>

                {/* Metrics 3-Col: Temperature, Speed, GPS */}
                <div className="sub-metrics-grid">
                  <div className="sub-metric-box">
                    <span className="sub-title">Temperature</span>
                    <strong
                      className={
                        vehicle.temperature >= 80 ? "val-danger" : "val-normal"
                      }
                    >
                      {vehicle.temperature}°C
                    </strong>
                  </div>

                  <div className="sub-metric-box">
                    <span className="sub-title">Speed</span>
                    <strong className="val-normal">{vehicle.speed} km/h</strong>
                  </div>

                  <div className="sub-metric-box">
                    <span className="sub-title">Position</span>
                    <span className="coord-text">
                      {vehicle.latitude.toFixed(2)}, {vehicle.longitude.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="card-actions">
                <button
                  className="inspect-btn"
                  onClick={() => setInspectVehicleId(vehicle.vehicleId)}
                >
                  <Gauge size={13} />
                  <span>Inspect History</span>
                </button>

                <button
                  className="locate-btn"
                  onClick={() =>
                    onSelectVehicleForMap &&
                    onSelectVehicleForMap(vehicle.vehicleId)
                  }
                  title="Locate on live tracking map"
                >
                  <MapPin size={13} />
                  <span>Map</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {processedVehicles.length === 0 && (
        <div className="vehicles-empty">
          <Truck size={36} />
          <h3>No Vehicles Found</h3>
          <p>No vehicles match "{searchQuery}" or the selected filter.</p>
        </div>
      )}

      {/* Vehicle Inspection Drawer / Modal */}
      {inspectedVehicle && (
        <div
          className="drawer-overlay"
          onClick={() => setInspectVehicleId(null)}
        >
          <div
            className="vehicle-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="drawer-title">
                <Truck size={22} />
                <div>
                  <h2>{inspectedVehicle.vehicleId}</h2>
                  <span>FLEET TELEMETRY & AUDIT TRAIL</span>
                </div>
              </div>
              <button
                className="close-drawer"
                onClick={() => setInspectVehicleId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Telemetry Overview */}
              <div className="drawer-section">
                <h4>LIVE TELEMETRY READINGS</h4>
                <div className="drawer-stats-grid">
                  <div className="drawer-stat-card">
                    <span>Battery</span>
                    <strong
                      style={{
                        color:
                          inspectedVehicle.battery <= 20
                            ? "#ef4444"
                            : "#10b981",
                      }}
                    >
                      {inspectedVehicle.battery}%
                    </strong>
                  </div>
                  <div className="drawer-stat-card">
                    <span>Engine Temp</span>
                    <strong
                      style={{
                        color:
                          inspectedVehicle.temperature >= 80
                            ? "#ef4444"
                            : "#7ce7c2",
                      }}
                    >
                      {inspectedVehicle.temperature}°C
                    </strong>
                  </div>
                  <div className="drawer-stat-card">
                    <span>Current Speed</span>
                    <strong>{inspectedVehicle.speed} km/h</strong>
                  </div>
                  <div className="drawer-stat-card">
                    <span>Status</span>
                    <span
                      className={`status-pill ${
                        getVehicleStatus(inspectedVehicle) === "Attention"
                          ? "pill-warn"
                          : "pill-active"
                      }`}
                    >
                      {getVehicleStatus(inspectedVehicle)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinates & Actions */}
              <div className="drawer-section">
                <h4>GEOSPATIAL COORDINATES</h4>
                <div className="drawer-geo-box">
                  <div>
                    <Compass size={16} />
                    <span>
                      Latitude: {inspectedVehicle.latitude.toFixed(5)} · Longitude:{" "}
                      {inspectedVehicle.longitude.toFixed(5)}
                    </span>
                  </div>
                  <button
                    className="focus-map-action"
                    onClick={() => {
                      onSelectVehicleForMap &&
                        onSelectVehicleForMap(inspectedVehicle.vehicleId);
                      setInspectVehicleId(null);
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Focus on Live Map</span>
                  </button>
                </div>
              </div>

              {/* Vehicle Historical Alerts Log */}
              <div className="drawer-section">
                <h4>RECORDED ANOMALIES & AUDIT LOG</h4>
                {loadingEvents ? (
                  <div className="drawer-loading">
                    <Radio size={20} className="spin-icon" />
                    <span>Fetching historical event records...</span>
                  </div>
                ) : vehicleEvents.length === 0 ? (
                  <div className="drawer-empty-history">
                    <Clock size={20} />
                    <span>No anomaly records logged for this vehicle.</span>
                  </div>
                ) : (
                  <div className="drawer-history-list">
                    {vehicleEvents.map((evt, idx) => (
                      <div key={evt._id || idx} className="drawer-history-item">
                        <div className="history-item-top">
                          <span
                            className={`history-type ${
                              evt.type === "LOW_BATTERY"
                                ? "type-battery"
                                : evt.type === "HIGH_TEMPERATURE"
                                ? "type-temp"
                                : ""
                            }`}
                          >
                            {evt.type}
                          </span>
                          <span className="history-time">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="history-msg">{evt.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
