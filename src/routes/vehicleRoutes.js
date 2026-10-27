const express = require("express");
const router = express.Router();

const {
  receiveTelemetry,
  getAllVehicles,
  getVehicleById,
} = require("../controllers/vehicleController");

router.post("/:vehicleId/telemetry", receiveTelemetry);
router.get("/", getAllVehicles);
router.get("/:vehicleId", getVehicleById);

module.exports = router;