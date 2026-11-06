import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Activity,
  AlertTriangle,
  Battery,
  Bell,
  Clock,
  Flame,
  Gauge,
  MapPin,
  Truck,
  Wifi,
} from "lucide-react";
import FleetMap from "./components/FleetMap";
import AlertsPanel from "./components/AlertsPanel";
import VehiclesView from "./components/VehiclesView";

function getVehicleStatus(vehicle) {
  if (vehicle.battery <= 20 || vehicle.temperature >= 80) {
    return "Attention";
  }
  return "Active";
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "vehicles" | "tracking" | "alerts"
  const [overviewTab, setOverviewTab] = useState("fleet"); // "fleet" | "alerts" for the right panel

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to PulseOps:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from PulseOps");
    });

    // 1. Live telemetry updates
    socket.on("vehicle:update", (updatedVehicle) => {
      setVehicles((currentVehicles) => {
        const exists = currentVehicles.some(
          (vehicle) => vehicle.vehicleId === updatedVehicle.vehicleId
        );

        if (exists) {
          return currentVehicles.map((vehicle) =>
            vehicle.vehicleId === updatedVehicle.vehicleId
              ? updatedVehicle
              : vehicle
          );
        }

        return [...currentVehicles, updatedVehicle];
      });
    });

    // 2. Real-time alerts broadcast from backend
    socket.on("alert:new", (newAlert) => {
      console.log("New real-time alert received:", newAlert);
      setAlerts((currentAlerts) => {
        const isDuplicate = currentAlerts.some(
          (a) =>
            (a._id && newAlert._id && a._id === newAlert._id) ||
            (a.vehicleId === newAlert.vehicleId &&
              a.type === newAlert.type &&
              Math.abs(new Date(a.timestamp) - new Date(newAlert.timestamp)) <
                4000)
        );

        if (isDuplicate) return currentAlerts;
        return [newAlert, ...currentAlerts];
      });
    });

    // 3. Fetch initial vehicles from MongoDB
    async function fetchVehicles() {
      try {
        const response = await fetch("http://localhost:5000/api/vehicles");
        if (!response.ok) {
          throw new Error("Failed to fetch vehicles");
        }
        const result = await response.json();
        setVehicles(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // 4. Fetch initial alerts from MongoDB
    async function fetchAlerts() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/vehicles/alerts?limit=50"
        );
        if (response.ok) {
          const result = await response.json();
          setAlerts(result.data || []);
        }
      } catch (err) {
        console.error("Failed to load initial alerts:", err.message);
      } finally {
        setAlertsLoading(false);
      }
    }

    fetchVehicles();
    fetchAlerts();

    return () => {
      socket.disconnect();
    };
  }, []);

  const activeCount = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Active"
  ).length;

  const attentionCount = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Attention"
  ).length;

  // Deduplicate active alerts for the quick alerts tab
  const activeAlertsList = alerts.reduce((acc, alert) => {
    const key = `${alert.vehicleId}:${alert.type}`;
    if (!acc.some((a) => `${a.vehicleId}:${a.type}` === key)) {
      acc.push(alert);
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "#8e8e93" }}>
        <p>Connecting to PulseOps fleet telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "#ff453a" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  function handleFocusVehicle(vehicleId) {
    setSelectedVehicleId(vehicleId);
    if (activeTab === "alerts") {
      setActiveTab("overview");
    }
  }

  return (
    <div className="app-shell">
      {/* macOS Sidebar Navigation */}
      <aside className="sidebar">
        <div className="macos-window-dots">
          <span className="window-dot dot-red" />
          <span className="window-dot dot-yellow" />
          <span className="window-dot dot-green" />
        </div>

        <div className="brand">
          <div className="brand-icon">
            <Activity size={18} />
          </div>
          <div>
            <h2>PulseOps</h2>
            <span>FLEET INTELLIGENCE</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <div
          className={`nav-item ${activeTab === "overview" ? "selected" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Gauge size={16} />
          <span>Overview</span>
        </div>

        <div
          className={`nav-item ${activeTab === "vehicles" ? "selected" : ""}`}
          onClick={() => setActiveTab("vehicles")}
        >
          <Truck size={16} />
          <span>Vehicles</span>
          <span className="nav-count" style={{ color: "#30d158" }}>
            {vehicles.length}
          </span>
        </div>

        <div
          className={`nav-item ${activeTab === "tracking" ? "selected" : ""}`}
          onClick={() => setActiveTab("tracking")}
        >
          <MapPin size={16} />
          <span>Live tracking</span>
        </div>

        <div
          className={`nav-item ${activeTab === "alerts" ? "selected" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          <Bell size={16} />
          <span>Alerts</span>
          {attentionCount > 0 && (
            <span className="nav-count">{attentionCount}</span>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="connection-dot" />
          <span>Fleet simulator</span>
          <span className="live-label">DEMO</span>
        </div>
      </aside>

      {/* Main App Content - 100% Fit to Screen */}
      <main className="main-content">
        {/* Compact macOS Topbar */}
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {activeTab === "overview" && "OPERATIONS / OVERVIEW"}
              {activeTab === "vehicles" && "OPERATIONS / ASSET MANAGEMENT"}
              {activeTab === "tracking" && "OPERATIONS / LIVE TRACKING"}
              {activeTab === "alerts" && "OPERATIONS / HEALTH ANOMALIES"}
            </p>
            <h1>
              {activeTab === "overview" && "Fleet overview"}
              {activeTab === "vehicles" && "Fleet Vehicles"}
              {activeTab === "tracking" && "Live Map Tracking"}
              {activeTab === "alerts" && "Fleet Health Alerts"}
            </h1>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            Live telemetry · Socket.IO
          </div>
        </header>

        {/* Spacious macOS KPI Summary Cards */}
        <section className="summary-grid">
          <SummaryCard
            icon={<Truck size={17} />}
            label="Total fleet"
            value={vehicles.length}
            detail="Registered vehicles"
            onClick={() => setActiveTab("vehicles")}
          />

          <SummaryCard
            icon={<Activity size={17} />}
            label="Operational"
            value={activeCount}
            detail="Normal parameters"
            onClick={() => setActiveTab("vehicles")}
          />

          <SummaryCard
            icon={<Bell size={17} />}
            label="Needs attention"
            value={attentionCount}
            detail="Requires review"
            warning={attentionCount > 0}
            onClick={() => setActiveTab("alerts")}
          />

          <SummaryCard
            icon={<Wifi size={17} />}
            label="Active alerts"
            value={activeAlertsList.length}
            detail="Unresolved anomalies"
            warning={activeAlertsList.length > 0}
            onClick={() => setActiveTab("alerts")}
          />
        </section>

        {/* TAB VIEW 1: Dedicated Full Alerts View */}
        {activeTab === "alerts" && (
          <div className="view-viewport-container">
            <AlertsPanel
              alerts={alerts}
              loading={alertsLoading}
              onSelectVehicle={handleFocusVehicle}
            />
          </div>
        )}

        {/* TAB VIEW 2: Dedicated Full Vehicles View */}
        {activeTab === "vehicles" && (
          <div className="view-viewport-container">
            <VehiclesView
              vehicles={vehicles}
              onSelectVehicleForMap={(vId) => {
                setSelectedVehicleId(vId);
                setActiveTab("overview");
              }}
            />
          </div>
        )}

        {/* TAB VIEW 3: Full-width Live Tracking Map */}
        {activeTab === "tracking" && (
          <div className="panel map-panel" style={{ flex: 1, minHeight: 0 }}>
            <div className="panel-header">
              <h2>Full-Screen Delhi Live Fleet Tracking</h2>
              <span className="map-tag">
                <MapPin size={12} /> LIVE MAP
              </span>
            </div>
            <FleetMap
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
            />
          </div>
        )}

        {/* TAB VIEW 4: Overview Command Center (Fit-to-Screen: Map on Left, Segmented List on Right) */}
        {activeTab === "overview" && (
          <section className="content-grid">
            {/* Left: Interactive Live Map */}
            <div className="panel map-panel">
              <div className="panel-header">
                <h2>Delhi Live Tracking</h2>
                <span className="map-tag">
                  <MapPin size={12} /> OPENSTREETMAP
                </span>
              </div>

              <FleetMap
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
              />

              <div className="map-footer">
                <span>
                  <span className="legend-dot green" /> Operational
                </span>
                <span>
                  <span className="legend-dot orange" /> Attention
                </span>
                <span>{vehicles.length} vehicles online</span>
              </div>
            </div>

            {/* Right: macOS Segmented Switcher (Fleet Vehicles OR Active Alerts) */}
            <div className="panel fleet-panel">
              <div className="panel-header">
                <div className="overview-segmented-tabs">
                  <button
                    className={`segmented-tab ${
                      overviewTab === "fleet" ? "active" : ""
                    }`}
                    onClick={() => setOverviewTab("fleet")}
                  >
                    <Truck size={12} />
                    <span>Fleet ({vehicles.length})</span>
                  </button>
                  <button
                    className={`segmented-tab ${
                      overviewTab === "alerts" ? "active" : ""
                    }`}
                    onClick={() => setOverviewTab("alerts")}
                  >
                    <Bell size={12} />
                    <span>Alerts ({activeAlertsList.length})</span>
                    {attentionCount > 0 && (
                      <span className="tab-warn-count">{attentionCount}</span>
                    )}
                  </button>
                </div>

                <span className="live-indicator-tag">
                  <span className="status-dot" /> LIVE
                </span>
              </div>

              {/* Internal Scrollable Content - Strictly stays inside viewport */}
              <div className="overview-scroll-container">
                {overviewTab === "fleet" ? (
                  <div className="vehicle-list">
                    {vehicles.map((vehicle) => {
                      const status = getVehicleStatus(vehicle);
                      const isAttention = status === "Attention";

                      return (
                        <div
                          className={`vehicle-row ${
                            selectedVehicleId === vehicle.vehicleId
                              ? "selected-row"
                              : ""
                          }`}
                          key={vehicle.vehicleId}
                          onClick={() => handleFocusVehicle(vehicle.vehicleId)}
                          title="Click to focus on map"
                        >
                          <div
                            className="vehicle-icon"
                            style={
                              isAttention
                                ? { background: "rgba(255,159,10,0.15)", color: "#ff9f0a" }
                                : {}
                            }
                          >
                            <Truck size={16} />
                          </div>

                          <div className="vehicle-info">
                            <strong>{vehicle.vehicleId}</strong>
                            <span>
                              {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                            </span>

                            <div className="vehicle-metrics">
                              <span
                                style={
                                  vehicle.battery <= 20
                                    ? { color: "#ff9f0a", fontWeight: 700 }
                                    : {}
                                }
                              >
                                <Battery size={11} />
                                {vehicle.battery}%
                              </span>

                              <span
                                style={
                                  vehicle.temperature >= 80
                                    ? { color: "#ff453a", fontWeight: 700 }
                                    : {}
                                }
                              >
                                <Activity size={11} />
                                {vehicle.temperature}°C
                              </span>

                              <span>{vehicle.speed} km/h</span>
                            </div>

                            {(vehicle.battery <= 20 || vehicle.temperature >= 80) && (
                              <div className="vehicle-alerts">
                                {vehicle.battery <= 20 && (
                                  <span className="vehicle-alert battery">
                                    <Battery size={10} /> Low Batt ({vehicle.battery}%)
                                  </span>
                                )}
                                {vehicle.temperature >= 80 && (
                                  <span className="vehicle-alert temp">
                                    <Flame size={10} /> Temp ({vehicle.temperature}°C)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <span
                            className={`vehicle-status ${
                              isAttention ? "warning" : ""
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Active Alerts List */
                  <div className="overview-alerts-list">
                    {activeAlertsList.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px 10px", color: "#8e8e93", fontSize: "12px" }}>
                        <p>No active anomalies detected.</p>
                      </div>
                    ) : (
                      activeAlertsList.map((alert, idx) => (
                        <div
                          key={alert._id || idx}
                          className="vehicle-row"
                          onClick={() => handleFocusVehicle(alert.vehicleId)}
                          style={{ borderLeft: alert.type === "LOW_BATTERY" ? "3px solid #ff9f0a" : "3px solid #ff453a" }}
                          title="Click to focus vehicle on map"
                        >
                          <div
                            className="vehicle-icon"
                            style={{
                              color: alert.type === "LOW_BATTERY" ? "#ff9f0a" : "#ff453a",
                              background: alert.type === "LOW_BATTERY" ? "rgba(255,159,10,0.15)" : "rgba(255,69,58,0.15)",
                            }}
                          >
                            <AlertTriangle size={15} />
                          </div>
                          <div className="vehicle-info">
                            <strong>{alert.vehicleId}</strong>
                            <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "#f5f5f7" }}>
                              {alert.message}
                            </p>
                            <span style={{ fontSize: "10px", color: "#8e8e93", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, detail, warning, onClick }) {
  return (
    <div
      className={`summary-card ${warning ? "card-warning" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      title={onClick ? "Click to view" : undefined}
    >
      <div className="summary-card-header">
        <span className="summary-card-label">{label}</span>
        <div className={`summary-icon ${warning ? "warning" : ""}`}>
          {icon}
        </div>
      </div>
      <div className="summary-card-body">
        <h2 className="summary-number">{value}</h2>
        {detail && <span className="summary-detail">{detail}</span>}
      </div>
    </div>
  );
}

export default App;
