import { useState, useMemo } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  Bell,
  Clock,
  Filter,
  Flame,
  Radio,
  Search,
  ShieldCheck,
  XCircle,
  History,
  Zap,
} from "lucide-react";
import "./AlertsPanel.css";

export default function AlertsPanel({
  alerts = [],
  loading = false,
  onSelectVehicle,
}) {
  const [viewMode, setViewMode] = useState("active"); // "active" (one per vehicle issue) | "history" (full log)
  const [filterType, setFilterType] = useState("ALL");
  const [searchVehicle, setSearchVehicle] = useState("");

  // Deduplicate active alerts so each problem for a vehicle is shown ONCE
  const activeAlerts = useMemo(() => {
    const map = new Map();
    // Sort latest first
    const sorted = [...alerts].sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );

    sorted.forEach((alert) => {
      const key = `${alert.vehicleId}:${alert.type}`;
      if (!map.has(key)) {
        map.set(key, alert);
      }
    });

    return Array.from(map.values());
  }, [alerts]);

  const displayedAlerts = useMemo(() => {
    const baseList = viewMode === "active" ? activeAlerts : alerts;

    return baseList.filter((alert) => {
      const matchesType =
        filterType === "ALL" || alert.type === filterType;
      const matchesSearch =
        !searchVehicle.trim() ||
        (alert.vehicleId &&
          alert.vehicleId
            .toLowerCase()
            .includes(searchVehicle.trim().toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [viewMode, activeAlerts, alerts, filterType, searchVehicle]);

  const stats = useMemo(() => {
    const lowBattery = activeAlerts.filter((a) => a.type === "LOW_BATTERY").length;
    const highTemp = activeAlerts.filter((a) => a.type === "HIGH_TEMPERATURE").length;
    return {
      activeTotal: activeAlerts.length,
      historyTotal: alerts.length,
      lowBattery,
      highTemp,
    };
  }, [activeAlerts, alerts]);

  function formatTime(timestamp) {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 5) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function getAlertIcon(type) {
    switch (type) {
      case "LOW_BATTERY":
        return <BatteryCharging size={16} className="alert-icon-svg" />;
      case "HIGH_TEMPERATURE":
        return <Flame size={16} className="alert-icon-svg" />;
      default:
        return <AlertTriangle size={16} className="alert-icon-svg" />;
    }
  }

  function getBadgeLabel(type) {
    switch (type) {
      case "LOW_BATTERY":
        return "LOW BATTERY";
      case "HIGH_TEMPERATURE":
        return "HIGH TEMP";
      case "GEOFENCE_ENTERED":
        return "ZONE ENTERED";
      case "GEOFENCE_EXITED":
        return "ZONE EXITED";
      default:
        return type;
    }
  }

  return (
    <div className="panel alerts-panel-component">
      {/* Header with Title and Mode Toggle */}
      <div className="alerts-panel-header">
        <div className="alerts-title-group">
          <div className="alerts-header-icon">
            <Bell size={20} />
          </div>
          <div>
            <h2>Fleet Operational Alerts</h2>
            <p>
              {viewMode === "active"
                ? "Current active anomalies (deduplicated per vehicle)"
                : "Complete historical event audit trail"}
            </p>
          </div>
        </div>

        {/* Mode Toggle: Active Incidents vs Full History */}
        <div className="alerts-mode-toggle">
          <button
            className={`mode-btn ${viewMode === "active" ? "active" : ""}`}
            onClick={() => setViewMode("active")}
            title="Show one entry per active vehicle problem"
          >
            <Zap size={13} />
            <span>Active Issues</span>
            <span className="mode-badge">{stats.activeTotal}</span>
          </button>
          <button
            className={`mode-btn ${viewMode === "history" ? "active" : ""}`}
            onClick={() => setViewMode("history")}
            title="View complete event log"
          >
            <History size={13} />
            <span>Event History</span>
            <span className="mode-badge">{stats.historyTotal}</span>
          </button>
        </div>
      </div>

      {/* Quick Stat Badges */}
      <div className="alerts-quick-stats">
        <div
          className={`quick-stat-chip ${filterType === "ALL" ? "active" : ""}`}
          onClick={() => setFilterType("ALL")}
        >
          <span>All {viewMode === "active" ? "Active" : "Logged"}</span>
          <strong>{viewMode === "active" ? stats.activeTotal : stats.historyTotal}</strong>
        </div>
        <div
          className={`quick-stat-chip chip-battery ${
            filterType === "LOW_BATTERY" ? "active" : ""
          }`}
          onClick={() => setFilterType("LOW_BATTERY")}
        >
          <BatteryCharging size={13} />
          <span>Low Battery</span>
          <strong>{stats.lowBattery}</strong>
        </div>
        <div
          className={`quick-stat-chip chip-temp ${
            filterType === "HIGH_TEMPERATURE" ? "active" : ""
          }`}
          onClick={() => setFilterType("HIGH_TEMPERATURE")}
        >
          <Flame size={13} />
          <span>High Temp</span>
          <strong>{stats.highTemp}</strong>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="alerts-controls-bar">
        <div className="alerts-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search Vehicle ID (e.g. DEL-104)..."
            value={searchVehicle}
            onChange={(e) => setSearchVehicle(e.target.value)}
          />
          {searchVehicle && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchVehicle("")}
              title="Clear search"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>

        <div className="alerts-filter-dropdown">
          <Filter size={14} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Alert Types</option>
            <option value="LOW_BATTERY">Low Battery Only</option>
            <option value="HIGH_TEMPERATURE">High Temperature Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Content Feed */}
      <div className="alerts-feed-container">
        {loading ? (
          <div className="alerts-state-loading">
            <Radio size={28} className="spin-icon" />
            <p>Synchronizing alerts with MongoDB...</p>
          </div>
        ) : displayedAlerts.length === 0 ? (
          <div className="alerts-state-empty">
            <div className="empty-shield">
              <ShieldCheck size={32} />
            </div>
            <h3>
              {viewMode === "active"
                ? "No Active Operational Alerts"
                : "No Events Recorded"}
            </h3>
            <p>
              {searchVehicle || filterType !== "ALL"
                ? "No alerts match the selected filter criteria."
                : "All delivery vehicles are operating within nominal battery, temperature, and speed boundaries."}
            </p>
          </div>
        ) : (
          <div className="alerts-list">
            {displayedAlerts.map((alert, index) => {
              const isBattery = alert.type === "LOW_BATTERY";
              const isTemp = alert.type === "HIGH_TEMPERATURE";
              const alertClass = isBattery
                ? "type-battery"
                : isTemp
                ? "type-temp"
                : "type-default";

              return (
                <div
                  key={alert._id || `${alert.vehicleId}-${alert.type}-${index}`}
                  className={`alert-card ${alertClass}`}
                  onClick={() =>
                    onSelectVehicle && onSelectVehicle(alert.vehicleId)
                  }
                  title="Click to locate vehicle on map"
                >
                  <div className={`alert-card-icon ${alertClass}`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="alert-card-body">
                    <div className="alert-card-top">
                      <div className="alert-vehicle-tag">
                        <strong>{alert.vehicleId}</strong>
                        <span className={`alert-badge ${alertClass}`}>
                          {getBadgeLabel(alert.type)}
                        </span>
                        {viewMode === "active" && (
                          <span className="live-status-pill">ONGOING</span>
                        )}
                      </div>
                      <span className="alert-timestamp">
                        <Clock size={11} />
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>

                    <p className="alert-message">{alert.message}</p>

                    {alert.latitude && alert.longitude && (
                      <div className="alert-coords">
                        <span>
                          Lat: {alert.latitude.toFixed(4)}, Lng:{" "}
                          {alert.longitude.toFixed(4)}
                        </span>
                        <span className="locate-hint">Click to locate on map →</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="alerts-panel-footer">
        <span>
          Showing {displayedAlerts.length}{" "}
          {viewMode === "active" ? "active issues" : "recorded events"}
        </span>
        <span>
          {viewMode === "active"
            ? "Deduped per vehicle problem"
            : "Chronological event log"}
        </span>
      </div>
    </div>
  );
}
