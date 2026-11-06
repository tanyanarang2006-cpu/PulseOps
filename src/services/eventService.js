
const VehicleEvent = require("../models/vehicleEvent");

async function createEvent(eventData) {
  return await VehicleEvent.create(eventData);
}

async function getEventsByVehicle(vehicleId) {
  return await VehicleEvent.find({ vehicleId })
    .sort({ timestamp: -1 });
}

async function getAllEvents(limit = 50) {
  return await VehicleEvent.find()
    .sort({ timestamp: -1 })
    .limit(limit);
}

module.exports = {
  createEvent,
  getEventsByVehicle,
  getAllEvents,
};
