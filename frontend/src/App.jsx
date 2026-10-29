
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Activity,
  Battery,
  Bell,
  Gauge,
  MapPin,
  Package,
  Truck,
  Wifi,
} from "lucide-react";

function getVehicleStatus(vehicle) {
  if (vehicle.battery <= 20 || vehicle.temperature >= 80) {
    return "Attention";
  }

  return "Active";
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to PulseOps:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from PulseOps");
    });
    
    socket.on("vehicle:update", (updatedVehicle) => {
      setVehicles((currentVehicles) => {
        const exists = currentVehicles.some(
          (vehicle) =>
            vehicle.vehicleId === updatedVehicle.vehicleId
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


    async function fetchVehicles() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/vehicles"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vehicles");
        }

        const result = await response.json();
        setVehicles(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();

    return () => {
      socket.disconnect();
    };
  }, []);

  function getVheicleAlerts(vehicle){
    const alerts =[];
    if(vehicle.battery<=20){
      alerts.push("Low Battery Remaining");
    }
    if(vehicle.temperature>=80){
      alerts.push("High Temperature Alert")
    }
    return alerts;
  }

  const activeCount = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Active"
  ).length;

  const attentionCount = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Attention"
  ).length;


  if (loading) {
    return <p>Loading vehicles...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <div>
            <h2>PulseOps</h2>
            <span>FLEET INTELLIGENCE</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <div className="nav-item selected">
          <Gauge size={18} />
          <span>Overview</span>
        </div>

        <div className="nav-item">
          <Truck size={18} />
          <span>Vehicles</span>
        </div>

        <div className="nav-item">
          <MapPin size={18} />
          <span>Live tracking</span>
        </div>

        <div className="nav-item">
          <Bell size={18} />
          <span>Alerts</span>
          <span className="nav-count">{attentionCount}</span>
        </div>

        <div className="sidebar-footer">
          <div className="connection-dot" />
          <span>Fleet simulator</span>
          <span className="live-label">DEMO</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">OPERATIONS / OVERVIEW</p>
            <h1>Fleet overview</h1>
            <p className="subtitle">
              Monitor your delivery operations in one place.
            </p>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            Demo environment
          </div>
        </header>

        <section className="summary-grid">
          <SummaryCard
            icon={<Truck size={20} />}
            label="Total vehicles"
            value={vehicles.length}
            detail="Registered in fleet"
          />

          <SummaryCard
            icon={<Activity size={20} />}
            label="Active vehicles"
            value={activeCount}
            detail="Currently operational"
          />

          <SummaryCard
            icon={<Bell size={20} />}
            label="Needs attention"
            value={attentionCount}
            detail="Requires review"
            warning
          />

          <SummaryCard
            icon={<Wifi size={20} />}
            label="Connectivity"
            value="Connected"
            detail="API data loaded"
          />
        </section>

        <section className="content-grid">
          <div className="panel map-panel">
            <div className="panel-header">
              <div>
                <h2>Live vehicle tracking</h2>
                <p>Vehicle positions across Delhi</p>
              </div>
              <span className="map-tag">
                <MapPin size={14} />
                LIVE MAP
              </span>
            </div>

            <div className="map-placeholder">
              <div className="map-placeholder-icon">
                <MapPin size={28} />
              </div>
              <h3>Your fleet map goes here</h3>
              <p>
                We'll add the interactive Delhi map and vehicle
                markers in the next step.
              </p>
            </div>

            <div className="map-footer">
              <span>
                <span className="legend-dot green" /> Active
              </span>
              <span>
                <span className="legend-dot orange" /> Attention
              </span>
              <span>{vehicles.length} vehicles in demo data</span>
            </div>
          </div>

          <div className="panel fleet-panel">
            <div className="panel-header">
              <div>
                <h2>Fleet vehicles</h2>
                <p>Latest vehicle status</p>
              </div>
              <span className="vehicle-count">
                {vehicles.length} vehicles
              </span>
            </div>

            <div className="vehicle-list">
              {vehicles.map((vehicle) => (
                <div
                  className="vehicle-row"
                  key={vehicle.vehicleId}
                >
                  <div className="vehicle-icon">
                    <Truck size={20} />
                  </div>

                  <div className="vehicle-info">
                    <strong>{vehicle.vehicleId}</strong>

                    <span>
                      {vehicle.latitude.toFixed(4)},{" "}
                      {vehicle.longitude.toFixed(4)}
                    </span>

                    <div className="vehicle-metrics">
                      <span>
                        <Battery size={13} />
                        {vehicle.battery}%
                      </span>

                      <span>
                        <Activity size={13} />
                        {vehicle.temperature}°C
                      </span>

                      <span>{vehicle.speed} km/h</span>
                    </div>
                  </div>

                  <span
                    className={`vehicle-status ${
                      getVehicleStatus(vehicle) === "Attention"
                        ? "warning"
                        : ""
                    }`}
                  >
                    {getVehicleStatus(vehicle)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <Package size={15} />
          PulseOps · Delivery fleet monitoring
          <span>Live API data · Simulator environment</span>
        </footer>
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, detail, warning }) {
  return (
    <div className="summary-card">
      <div className={`summary-icon ${warning ? "warning" : ""}`}>
        {icon}
      </div>
      <p>{label}</p>
      <h2>{value}</h2>
      <span>{detail}</span>
    </div>
  );
}

export default App;
