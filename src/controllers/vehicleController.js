
const vehicleService = require("../services/vehicleService");
const { getIO } = require("../config/socket");
const { detectVehicleAlerts } = require("../services/alertService");
const {
  detectGeofenceTransition,
} = require("../services/geofenceService");
const {
  processVehicleAlerts,
} = require("../services/eventDetectionService");

async function receiveTelemetry(req, res) {
  try {
    const { vehicleId } = req.params;
    const { latitude, longitude, battery, temperature, speed } = req.body;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(battery) ||
      battery < 0 ||
      battery > 100 ||
      !Number.isFinite(temperature) ||
      !Number.isFinite(speed) ||
      speed < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle telemetry",
      });
    }

    const reading = await vehicleService.updateVehicle(vehicleId, {
      latitude,
      longitude,
      battery,
      temperature,
      speed,
    });
    const alerts = detectVehicleAlerts(reading);

    if (alerts.length > 0) {
      console.log("Alerts detected:", vehicleId, alerts);
    }

    await processVehicleAlerts(reading, alerts);

await processVehicleAlerts(reading, alerts);
    //Geofence check
    const geofence = detectGeofenceTransition(
      vehicleId,
      reading.latitude,
      reading.longitude
    );

    if (geofence.transition === "ENTERED") {
      console.log(`${vehicleId} ENTERED the delivery zone`);
    } else if (geofence.transition === "EXITED") {
      console.log(`${vehicleId} EXITED the delivery zone`);
    }

    console.log("Telemetry received:", reading);
    const io = getIO();
    io.emit("vehicle:update", reading.toObject());

    return res.status(201).json({
      success: true,
      message: "Telemetry received",
      data: reading,
    });
  } catch (error) {
    console.error("Error receiving telemetry:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save vehicle telemetry",
    });
  }
}



async function getAllVehicles(req, res) {
  try {
    const vehicles = await vehicleService.getAllVehicles();

    return res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
    });
  }
}

async function getVehicleById(req, res) {
  try {
    const vehicle = await vehicleService.getVehicleById(
      req.params.vehicleId
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Error fetching vehicle:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
    });
  }
}

module.exports = {
  receiveTelemetry,
  getAllVehicles,
  getVehicleById,
};
