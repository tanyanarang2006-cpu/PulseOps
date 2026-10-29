
function detectVehicleAlerts(vehicle) {
  const alerts = [];

  if (vehicle.battery <= 20) {
    alerts.push("LOW_BATTERY");
  }

  if (vehicle.temperature >= 80) {
    alerts.push("HIGH_TEMPERATURE");
  }

  return alerts;
}

module.exports = { detectVehicleAlerts };