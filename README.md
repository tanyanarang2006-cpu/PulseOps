# PulseOps – Delivery Fleet Monitoring System

> A real-time, event-driven fleet intelligence platform for monitoring delivery vehicles, tracking live geospatial movements, diagnosing health anomalies, and preventing operational downtime.

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socket.io&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?logo=leaflet&logoColor=white)

---

## 1. Project Overview

**PulseOps** is a full-stack telemetry and fleet operations platform. In last-mile delivery fleets, hardware sensors continuously transmit GPS positions, engine temperatures, and battery levels. Without centralized real-time monitoring and anomaly detection, operations managers face unexpected breakdowns, dead batteries mid-route, and operational delays.

PulseOps solves this by simulating an active delivery fleet across Delhi, streaming real-time telemetry over WebSockets, persisting state in MongoDB, and providing an executive-grade **macOS-inspired desktop command center** with zero page scrolling.

---

## 2. System Architecture

```text
  +-----------------------------------------------------------+
  |              Node.js Fleet Telemetry Simulator            |
  |   (Emits GPS, Battery, Temp & Speed every 2 seconds)     |
  +-----------------------------------------------------------+
                                |
                        HTTP POST /telemetry
                                v
  +-----------------------------------------------------------+
  |                   Express Backend Engine                  |
  |  - Telemetry Validator                                    |
  |  - Mongoose State Upsert (Vehicle model)                  |
  |  - Event Detection & Alert Cooldown Service               |
  |  - Event Logging (VehicleEvent model in MongoDB)          |
  +-----------------------------------------------------------+
             |                                       |
    Socket.IO Broadcast                     REST Query Endpoints
  (vehicle:update, alert:new)             (/api/vehicles, /alerts)
             v                                       v
  +-----------------------------------------------------------+
  |                  React 19 + Vite Frontend                 |
  |  - Fit-to-Screen macOS Graphite Layout (Single Viewport)  |
  |  - Leaflet + OpenStreetMap Live Delhi Tracking            |
  |  - Deduplicated Active Alerts Feed & Event Audit Trail    |
  |  - Fleet Asset Management with Vehicle Inspection Drawer  |
  +-----------------------------------------------------------+
```

---

## 3. Key Engineering Highlights (Placement & Interview Talking Points)

### A. High-Frequency Telemetry Ingestion without DOM Re-render Bottlenecks
- When 5–10 vehicles emit updates every 2 seconds, re-mounting React components or re-initializing Leaflet canvas tiles causes UI lag.
- **Solution:** Integrated Leaflet directly via React `useRef`. Telemetry ticks execute $O(1)$ marker coordinate updates (`marker.setLatLng()`) and update popup DOM trees in-place, bypassing React DOM reconciliation.

### B. Sensor Thrashing & Alert Debouncing (Hysteresis & Cooldown)
- **The Problem:** Sensor readings fluctuate around thresholds (e.g. 79.9°C to 80.2°C). Naive detection creates and clears alerts on every tick, spamming the database with thousands of duplicate events.
- **Solution:** Implemented stateful debouncing in `eventDetectionService.js` with an in-memory `lastTriggered` tracking map and a 10-minute cooldown window. Ongoing alerts record **once** upon state transition and do not emit repetitive alerts.

### C. Active Incidents vs. Historical Event Audit Logs
- The frontend separates **Active Issues** (deduplicated by vehicle and alert type so operators see each current problem once) from the **Complete Event History** (an immutable audit trail of past events fetched from MongoDB).

### D. Fit-to-Screen Native macOS Command Center
- Built as a single-viewport (`100vh`) operations dashboard. Window traffic lights, clean Apple dark graphite palette (`#161618`), and segmented tabs ensure zero vertical page scrolling.

---

## 4. Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Leaflet, OpenStreetMap, Lucide React, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO Server, CORS, Dotenv |
| **Database** | MongoDB, Mongoose ODM |
| **Simulator** | Custom Node.js autonomous simulator with realistic drift & depot auto-recharge |
| **Styling** | Modular Vanilla CSS, Apple SF Pro font stack, macOS graphite materials |

---

## 5. Core Features

### 🚚 Interactive Live Map
- Powered by **Leaflet** and **OpenStreetMap** (100% free, zero API key required).
- Custom macOS vehicle capsules displaying live Vehicle ID and pulsing status rings (Green = Operational, Amber = Needs Attention).
- Interactive frosted glass popups displaying live Battery, Engine Temp, Speed, Coordinates, and active warning banners.
- Selecting any vehicle from the fleet list automatically pans and flies the map camera to that vehicle.

### ⚠️ Real-Time Operational Alerts Feed
- Detects `LOW_BATTERY` ($\le 20\%$) and `HIGH_TEMPERATURE` ($\ge 80^\circ\text{C}$).
- Broadcasts newly detected events immediately over Socket.IO (`alert:new`).
- Filter by alert type (`All`, `Low Battery`, `High Temp`) and search by Vehicle ID.
- Toggle between **Active Issues** (one card per unresolved problem) and **Event History** (full log).

### 🔍 Fleet Asset Management View
- Dedicated view for fleet managers to inspect vehicles in detail.
- Search vehicles by ID with real-time filtering.
- Filter chips: `All Vehicles`, `Operational`, `Needs Attention`.
- Metric sorting: Vehicle ID, Lowest Battery, Highest Temperature, Top Speed.
- Visual battery gauge progress bars with color thresholds (Green > 50%, Amber 20–50%, Red $\le$ 20%).
- **Vehicle Inspection Drawer:** Sliding macOS sheet showing live telemetry readings, coordinates, and historical anomaly records for that specific vehicle.

### 📊 Dynamic Executive KPI Cards
- **Total Fleet:** Count of all registered delivery vehicles.
- **Operational:** Vehicles operating within normal limits.
- **Needs Attention:** Vehicles requiring immediate operator review.
- **Active Alerts:** Total ongoing anomaly conditions across the fleet.

---

## 6. API Reference

### Vehicles

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/vehicles` | Fetch all vehicles and their latest telemetry |
| `GET` | `/api/vehicles/:vehicleId` | Fetch a single vehicle by vehicle ID |
| `POST` | `/api/vehicles/:vehicleId/telemetry` | Ingest vehicle telemetry (lat, lng, battery, temp, speed) |

### Alerts & Events

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/vehicles/alerts` | Fetch recent alerts across the fleet (supports `?limit=50`) |
| `GET` | `/api/vehicles/:vehicleId/events` | Fetch complete anomaly and event history for a vehicle |

---

## 7. WebSocket Events (Socket.IO)

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `vehicle:update` | Server $\rightarrow$ Client | Vehicle object | Broadcasts latest telemetry tick every 2 seconds |
| `alert:new` | Server $\rightarrow$ Client | VehicleEvent object | Broadcasts newly recorded health alert immediately |

---

## 8. Database Schema

### `Vehicle` Model
```javascript
{
  vehicleId: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  battery: { type: Number, min: 0, max: 100, required: true },
  temperature: { type: Number, required: true },
  speed: { type: Number, min: 0, required: true },
  timestamp: { type: Date, default: Date.now }
}
```

### `VehicleEvent` Model
```javascript
{
  vehicleId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["LOW_BATTERY", "HIGH_TEMPERATURE", "GEOFENCE_ENTERED", "GEOFENCE_EXITED"],
    required: true
  },
  message: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}
```

---

## 9. Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally on `mongodb://127.0.0.1:27017` or via MongoDB Atlas.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/PulseOps.git
cd PulseOps
```

### 2. Configure Backend Environment
Ensure `.env` exists in the project root:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/PulseOps
```

### 3. Install Dependencies
```bash
# Install backend dependencies (in root directory)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 10. Running the Application

To run the full platform, open **3 terminal tabs**:

### Terminal 1: Start Backend Server
```bash
# In the project root:
npm start
# Output: PulseOps running on port 5000 | MongoDB Connected
```

### Terminal 2: Start Vehicle Telemetry Simulator
```bash
# In the project root:
node simulator/vehicleSimulator.js
# Output: PulseOps vehicle simulator started (transmitting telemetry every 2s)
```

### Terminal 3: Start Frontend Dashboard
```bash
# Navigate to frontend folder:
cd frontend
npm run dev
# Vite runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser to view the live dashboard.

---

## 11. Folder Structure

```text
PulseOps/
├── .env                              # Environment configuration
├── package.json                      # Backend dependencies & scripts
├── README.md                         # Project documentation
│
├── simulator/
│   └── vehicleSimulator.js           # Multi-vehicle telemetry generator
│
├── src/
│   ├── server.js                     # Express server & HTTP listener
│   ├── config/
│   │   ├── db.js                     # MongoDB connection
│   │   └── socket.js                 # Socket.IO instance manager
│   ├── controllers/
│   │   └── vehicleController.js      # Telemetry, vehicles & alerts handlers
│   ├── models/
│   │   ├── vehicle.js                # Latest vehicle reading schema
│   │   └── vehicleEvent.js           # Persistent event audit schema
│   ├── routes/
│   │   └── vehicleRoutes.js          # REST API endpoints
│   └── services/
│       ├── alertService.js           # Threshold check logic
│       ├── eventDetectionService.js  # Cooldown & deduplication engine
│       ├── eventService.js           # Database queries for events
│       ├── geofenceService.js        # Geofencing transitions
│       └── vehicleService.js         # Upsert latest vehicle telemetry
│
└── frontend/
    ├── index.html                    # HTML entry point
    ├── package.json                  # Frontend dependencies
    ├── vite.config.js                # Vite build configuration
    └── src/
        ├── main.jsx                  # React application root
        ├── App.jsx                   # Master dashboard, state & tab routing
        ├── index.css                 # Master macOS theme & fit-to-screen layout
        └── components/
            ├── FleetMap.jsx          # Leaflet OpenStreetMap live tracking
            ├── FleetMap.css          # Apple Maps style annotations & popups
            ├── AlertsPanel.jsx       # Operational alerts feed & event logs
            ├── AlertsPanel.css       # Alerts styling & segmented controls
            ├── VehiclesView.jsx      # Asset management & inspection drawer
            └── VehiclesView.css      # Fleet grid & telemetry progress bars
```

---

## 12. Future Roadmap

- [ ] Multi-zone geofence visualization with polygon overlay on the map.
- [ ] Offline vehicle detection with automated timeout alerts if telemetry pauses > 15s.
- [ ] Per-vehicle destination assignment and arrival radius calculation.
- [ ] Historical route playback with polyline breadcrumb trails.

---

## 13. Author

Built with pride by a **Third-Year Computer Engineering Student** specializing in full-stack web applications and real-time distributed systems.
