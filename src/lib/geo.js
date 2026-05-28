// Haversine formula to calculate distance between two GPS coordinates
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  const km = meters / 1000;
  if (km < 1.6) {
    return `${km.toFixed(1)}km`;
  }
  const miles = km / 1.609;
  return `${miles.toFixed(1)}mi`;
}

export function isWithinRadius(userLat, userLng, dropLat, dropLng, radiusMeters) {
  const distance = haversineDistance(userLat, userLng, dropLat, dropLng);
  return distance <= radiusMeters;
}

export function metersToRadiusLabel(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  if (meters < 1609) return `${(meters / 1000).toFixed(1)}km`;
  return `${(meters / 1609).toFixed(1)}mi`;
}

export function getExpirationDate(expiration) {
  const now = new Date();
  switch (expiration) {
    case '15min': return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    case '1hr': return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case '24hr': return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'permanent': return null;
    default: return null;
  }
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}