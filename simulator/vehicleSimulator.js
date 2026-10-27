
const VEHICLES = [
  {
    vehicleId: "DEL-101",
    latitude: 28.6139,
    longitude: 77.2090,
    battery: 95,
  },
  {
    vehicleId: "DEL-102",
    latitude: 28.6200,
    longitude: 77.2150,
    battery: 72,
  },
  {
    vehicleId: "DEL-103",
    latitude: 28.6050,
    longitude: 77.2000,
    battery: 48,
  },
  {
    vehicleId: "DEL-104",
    latitude: 28.6300,
    longitude: 77.2250,
    battery: 18,
  },
  {
    vehicleId: "DEL-105",
    latitude: 28.5950,
    longitude: 77.2200,
    battery: 83,
  },
];

const API_URL = "http://localhost:5000";

async function sendTelemetry(vehicle) {
  // Simulate a small movement
  vehicle.latitude += (Math.random() - 0.5) * 0.001;
  vehicle.longitude += (Math.random() - 0.5) * 0.001;

  // Simulate battery consumption
  vehicle.battery = Math.max(
    0,
    vehicle.battery - Math.random() * 0.1
  );

  const temperature = Number(
    (65 + Math.random() * 20).toFixed(1)
  );

  const speed = Number(
    (10 + Math.random() * 40).toFixed(1)
  );

  const payload = {
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    battery: Number(vehicle.battery.toFixed(1)),
    temperature,
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
