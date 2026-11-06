
const VEHICLES = [
  {
    vehicleId: "DEL-101",
    latitude: 28.6139,
    longitude: 77.2090,
    battery: 95,
    temperature: 68.0,
  },
  {
    vehicleId: "DEL-102",
    latitude: 28.6200,
    longitude: 77.2150,
    battery: 72,
    temperature: 71.5,
  },
  {
    vehicleId: "DEL-103",
    latitude: 28.6050,
    longitude: 77.2000,
    battery: 48,
    temperature: 82.5, // High Temperature test vehicle
  },
  {
    vehicleId: "DEL-104",
    latitude: 28.6300,
    longitude: 77.2250,
    battery: 18, // Low Battery test vehicle
    temperature: 69.0,
  },
  {
    vehicleId: "DEL-105",
    latitude: 28.68,
    longitude: 77.2090,
    battery: 83,
    temperature: 70.0,
  },
];

const API_URL = "http://localhost:5000";

async function sendTelemetry(vehicle) {
  // Movement simulation
  if (vehicle.vehicleId === "DEL-105") {
    vehicle.latitude = 28.68;
    vehicle.longitude = 77.2090;
  } else {
    vehicle.latitude += (Math.random() - 0.5) * 0.001;
    vehicle.longitude += (Math.random() - 0.5) * 0.001;
  }

  // Battery simulation
  if (vehicle.vehicleId === "DEL-104") {
    // Low battery test vehicle: stays in 15% - 18% alert range
    vehicle.battery = Math.max(14, Math.min(18, Number((vehicle.battery + (Math.random() - 0.5) * 0.1).toFixed(1))));
  } else {
    // Normal healthy vehicles: consume battery gradually, recharge at 25%
    if (vehicle.battery <= 25) {
      vehicle.battery = 95; // Recharged at depot
    } else {
      vehicle.battery = Number((vehicle.battery - Math.random() * 0.04).toFixed(1));
    }
  }

  // Temperature simulation
  if (vehicle.vehicleId === "DEL-103") {
    // Overheating test vehicle: stays in 82°C - 85°C alert range
    vehicle.temperature = Math.max(81.5, Math.min(84.5, Number((vehicle.temperature + (Math.random() - 0.5) * 0.1).toFixed(1))));
  } else {
    // Normal vehicles: stay in nominal 65°C - 72°C operating range (NO ALERTS)
    vehicle.temperature = Math.max(64, Math.min(72, Number((vehicle.temperature + (Math.random() - 0.5) * 0.1).toFixed(1))));
  }

  const speed = Number(
    (10 + Math.random() * 35).toFixed(1)
  );

  const payload = {
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    battery: vehicle.battery,
    temperature: vehicle.temperature,
    speed,
  };

  try {
    const response = await fetch(
      `${API_URL}/api/vehicles/${vehicle.vehicleId}/telemetry`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    console.log(
      `${vehicle.vehicleId} | Battery: ${payload.battery}% | ` +
      `Temperature: ${temperature} | Speed: ${speed}`
    );
  } catch (error) {
    console.error(
      `Failed to send ${vehicle.vehicleId}:`,
      error.message
    );
  }
}

async function runSimulation() {
  console.log("PulseOps vehicle simulator started");

  while (true) {
    await Promise.all(
      VEHICLES.map((vehicle) => sendTelemetry(vehicle))
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

runSimulation();
