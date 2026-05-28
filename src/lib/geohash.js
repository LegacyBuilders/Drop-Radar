import ngeohash from "ngeohash";

// Geohash precision table (approximate cell size at the equator):
//   5 chars → ~4.9 km × 4.9 km   (city zoom)
//   6 chars → ~1.2 km × 0.6 km
//   7 chars → ~153 m × 153 m     (default drop precision)
//   8 chars → ~38 m × 19 m
//
// Drop Radar uses geohash7 for nearby queries (cell smaller than typical
// drop radius, larger than GPS noise) and geohash5 for city-scale heatmaps.

export const DEFAULT_PRECISION = 7;

export function encode(lat, lng, precision = DEFAULT_PRECISION) {
  return ngeohash.encode(lat, lng, precision);
}

export function decode(hash) {
  const { latitude, longitude } = ngeohash.decode(hash);
  return { lat: latitude, lng: longitude };
}

// 9-cell neighborhood (the cell + 8 surrounding cells) — covers any point
// within `cellSize` meters of the user, the typical drop unlock radius.
export function neighbors9(hash) {
  return [hash, ...ngeohash.neighbors(hash)];
}

// Pick a geohash precision appropriate for the current Leaflet zoom level.
// Lower zoom = larger cell = shorter prefix.
export function prefixForZoom(zoom) {
  if (zoom >= 17) return 8;
  if (zoom >= 14) return 7;
  if (zoom >= 11) return 6;
  if (zoom >= 8) return 5;
  return 4;
}

// Convenience: encode at both precisions Drop Radar stores on every drop.
export function encodeBoth(lat, lng) {
  return {
    geohash7: encode(lat, lng, 7),
    geohash5: encode(lat, lng, 5),
  };
}
