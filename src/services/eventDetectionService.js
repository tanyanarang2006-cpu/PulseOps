
const eventService = require("./eventService");
const { getIO } = require("../config/socket");

// Active alerts per vehicle: vehicleId -> Set of alert types
const activeAlerts = new Map();

// Track when each alert was last recorded: "vehicleId:alertType" -> timestamp
const lastTriggered = new Map();

// Minimum interval before re-recording the same continuous alert (10 minutes)
const ALERT_COOLDOWN_MS = 10 * 60 * 1000;

async function processVehicleAlerts(vehicle, alerts) {
  const vehicleId = vehicle.vehicleId;
  const previousAlerts = activeAlerts.get(vehicleId) || new Set();
  const currentAlerts = new Set(alerts);
  const now = Date.now();

  for (const alert of currentAlerts) {
    const alertKey = `${vehicleId}:${alert}`;
    const lastTime = lastTriggered.get(alertKey) || 0;
    const isNew = !previousAlerts.has(alert);
    const cooldownExpired = now - lastTime > ALERT_COOLDOWN_MS;

    // Record only if it's a new occurrence or after long cooldown
    if (isNew || cooldownExpired) {
      lastTriggered.set(alertKey, now);

      const newEvent = await eventService.createEvent({
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

      try {
        const io = getIO();
        io.emit(
          "alert:new",
          newEvent.toObject ? newEvent.toObject() : newEvent
        );
      } catch (err) {
        console.error("Socket emit alert:new failed:", err.message);
      }
    }
  }

  // Update active alerts state
  activeAlerts.set(vehicleId, currentAlerts);
}

module.exports = { processVehicleAlerts };
