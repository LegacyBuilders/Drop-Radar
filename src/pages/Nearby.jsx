import { useState, useMemo } from "react";
import { Radio, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import useGeolocation from "@/hooks/useGeolocation";
import NearbyDropCard from "@/components/NearbyDropCard";
import DropDetail from "@/components/DropDetail";
import { haversineDistance, isExpired } from "@/lib/geo";

export default function Nearby() {
  const { position, loading } = useGeolocation();
  const [selectedDrop, setSelectedDrop] = useState(null);

  const { isLoading, data } = db.useQuery({
    drops: {
      $: {
        where: { status: "active" },
        order: { created_at: "desc" },
        limit: 200,
      },
    },
  });

  const drops = useMemo(() => {
    const active = (data?.drops ?? []).filter((d) => !isExpired(d.expires_at));
    if (!position) return active;
    return [...active].sort(
      (a, b) =>
        haversineDistance(position.lat, position.lng, a.latitude, a.longitude) -
        haversineDistance(position.lat, position.lng, b.latitude, b.longitude)
    );
  }, [data, position]);

  const unlocked = drops.filter(
    (d) =>
      position &&
      haversineDistance(position.lat, position.lng, d.latitude, d.longitude) <=
        d.radius_meters
  );
  const locked = drops.filter(
    (d) =>
      !position ||
      haversineDistance(position.lat, position.lng, d.latitude, d.longitude) >
        d.radius_meters
  );

  if (loading || (isLoading && !data)) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Nearby Drops</h1>
            <p className="text-xs text-muted-foreground">{drops.length} drops found</p>
          </div>
        </div>

        {unlocked.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-medium text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Unlocked ({unlocked.length})
            </h2>
            <div className="space-y-2">
              {unlocked.map((drop) => (
                <NearbyDropCard
                  key={drop.id}
                  drop={drop}
                  userPosition={position}
                  onClick={() => setSelectedDrop(drop)}
                />
              ))}
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Locked ({locked.length})
            </h2>
            <div className="space-y-2">
              {locked.map((drop) => (
                <NearbyDropCard
                  key={drop.id}
                  drop={drop}
                  userPosition={position}
                  onClick={() => setSelectedDrop(drop)}
                />
              ))}
            </div>
          </div>
        )}

        {drops.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Radio className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No drops nearby</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to drop something!</p>
          </div>
        )}
      </div>

      {selectedDrop && (
        <DropDetail
          drop={selectedDrop}
          onClose={() => setSelectedDrop(null)}
          userPosition={position}
        />
      )}
    </div>
  );
}
