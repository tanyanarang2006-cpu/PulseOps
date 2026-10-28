
const Vehicle = require("../models/vehicle");

async function updateVehicle(vehicleId, telemetry) {
  const vehicle = await Vehicle.findOneAndUpdate(
    { vehicleId },
    {
      ...telemetry,
      vehicleId,
      timestamp: new Date(),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return vehicle;
}

async function getAllVehicles() {
  return await Vehicle.find();
}

async function getVehicleById(vehicleId) {
  return await Vehicle.findOne({ vehicleId });
}

module.exports = {
  updateVehicle,
  getAllVehicles,
  getVehicleById,
};
