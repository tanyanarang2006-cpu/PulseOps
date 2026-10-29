
const mongoose = require("mongoose");

const vehicleEventSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    index: true,
  },

  type: {
    type: String,
    enum: [
      "LOW_BATTERY",
      "HIGH_TEMPERATURE",
      "GEOFENCE_ENTERED",
      "GEOFENCE_EXITED",
    ],
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  latitude: {
    type: Number,
    required: true,
  },

  longitude: {
    type: Number,
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VehicleEvent", vehicleEventSchema);
