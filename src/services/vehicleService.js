const vehicles = new Map();

function updateVehicle(vehicleId , telemetry){
    const reading ={
        vehicleId,
        ...telemetry,
        timestamp: new Date().toISOString(),
    }
    vehicles.set(vehicleId,reading);
    return reading;
}

function getAllVehicles(){
    return Array.from(vehicles.values());
}

function getVehicleById(vehicleId) {
  return vehicles.get(vehicleId);
}

module.exports = {
  updateVehicle,
  getAllVehicles,
  getVehicleById,
};
