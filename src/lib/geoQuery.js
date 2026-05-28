// Pluggable nearby-drops provider.
//
// Default provider is "instant" — queries InstantDB using a geohash7 prefix
// match and refines client-side via haversine. Phase 3 will add a "postgis"
// provider for hot geohash cells once density crosses ~500 drops/cell; this
// abstraction keeps the page code unchanged when we flip the toggle.
//
// Phase 0 ships only the helpers; pages still use the legacy
// `db.useQuery({ drops: { $: { where: { status: 'active' } } } })`.
// Phase 1 swaps them to `useNearbyDrops` below.

import { db } from "./db";
import { encode, neighbors9 } from "./geohash";
import { haversineDistance, isExpired } from "./geo";

const PROVIDER = "instant";

export function getProvider() {
  return PROVIDER;
}

// React hook: live query for active, non-expired drops within ~9-cell radius.
// Returns { isLoading, error, drops } with drops sorted by distance asc.
export function useNearbyDrops(position, { precision = 7, limit = 200 } = {}) {
  if (!position) {
    return { isLoading: true, error: null, drops: [] };
  }

  const cell = encode(position.lat, position.lng, precision);
  const cells = neighbors9(cell);

  const query = {
    drops: {
      $: {
        where: {
          status: "active",
          or: cells.map((c) => ({ geohash7: { $like: `${c}%` } })),
        },
        limit,
        order: { created_at: "desc" },
      },
    },
  };

  const { isLoading, error, data } = db.useQuery(query);
  const drops = (data?.drops ?? [])
    .filter((d) => !isExpired(d.expires_at))
    .map((d) => ({
      ...d,
      _distance: haversineDistance(position.lat, position.lng, d.latitude, d.longitude),
    }))
    .sort((a, b) => a._distance - b._distance);

  return { isLoading, error, drops };
}
