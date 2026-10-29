const EARTH_RADIUS_KM = 6371;

const DELIVERY_ZONE = {
  latitude: 28.6139,
  longitude: 77.2090,
  radiusKm: 5,
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}


const vehicleGeofenceStates = new Map();

function detectGeofenceTransition(vehicleId, latitude, longitude) {
  const distance = calculateDistance(
    latitude,
    longitude,
    DELIVERY_ZONE.latitude,
    DELIVERY_ZONE.longitude
  );

  const isInside = distance <= DELIVERY_ZONE.radiusKm;
  const wasInside = vehicleGeofenceStates.get(vehicleId);

  let transition = null;

  if (wasInside !== undefined && wasInside !== isInside) {
    transition = isInside ? "ENTERED" : "EXITED";
  }

  vehicleGeofenceStates.set(vehicleId, isInside);

  return { distance, isInside, transition };
}


module.exports = { calculateDistance,
    DELIVERY_ZONE,
     detectGeofenceTransition
};