
const VehicleEvent = require("../models/vehicleEvent");

async function createEvent(eventData) {
  return await VehicleEvent.create(eventData);
}

async function getEventsByVehicle(vehicleId) {
  return await VehicleEvent.find({ vehicleId })
    .sort({ timestamp: -1 });
}

module.exports = {
  createEvent,
  getEventsByVehicle,
};
