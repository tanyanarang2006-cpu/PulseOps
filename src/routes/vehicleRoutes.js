const express = require("express");
const router = express.Router();

const {
  receiveTelemetry,
  getAllVehicles,
  getVehicleById,
  getRecentAlerts,
  getVehicleEvents,
} = require("../controllers/vehicleController");

router.post("/:vehicleId/telemetry", receiveTelemetry);
router.get("/alerts", getRecentAlerts);
router.get("/", getAllVehicles);
router.get("/:vehicleId", getVehicleById);
router.get("/:vehicleId/events", getVehicleEvents);

module.exports = router;