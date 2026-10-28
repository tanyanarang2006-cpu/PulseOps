
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  battery: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  temperature: {
    type: Number,
    required: true,
  },
  speed: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);