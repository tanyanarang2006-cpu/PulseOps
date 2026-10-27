const vehicleService = require("../services/vehicleService");

function receiveTelemetry(req, res) {
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

  const reading = vehicleService.updateVehicle(vehicleId, {
    latitude,
    longitude,
    battery,
    temperature,
    speed,
  });

  console.log("Telemetry received:", reading);

  return res.status(201).json({
    success: true,
    message: "Telemetry received",
    data: reading,
  });
}

function getAllVehicles(req,res) {
    const vehicles=vehicleService.getAllVehicles();

    return res.json({
        success:true,
        count:vehicles.length,
        data:vehicles,
    });
}

function getVehicleById(req, res) {
  const vehicle = vehicleService.getVehicleById(req.params.vehicleId);

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
}

module.exports = {
  receiveTelemetry,
  getAllVehicles,
  getVehicleById,
};