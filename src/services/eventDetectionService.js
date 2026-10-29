
const eventService = require("./eventService");

const activeAlerts = new Map();

async function processVehicleAlerts(vehicle, alerts) {
  const vehicleId = vehicle.vehicleId;
  const previousAlerts = activeAlerts.get(vehicleId) || new Set();
  const currentAlerts = new Set(alerts);

  for (const alert of currentAlerts) {
    if (!previousAlerts.has(alert)) {
      await eventService.createEvent({
        vehicleId,
        type: alert,
        message:
          alert === "LOW_BATTERY"
            ? `Battery is low: ${vehicle.battery}%`
            : `Temperature is high: ${vehicle.temperature}°C`,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
      });

      console.log(`New event recorded: ${vehicleId} - ${alert}`);
    }
  }

  activeAlerts.set(vehicleId, currentAlerts);
}

module.exports = { processVehicleAlerts };
