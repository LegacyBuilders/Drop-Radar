import { useState } from "react";
import { Plus, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import useGeolocation from "@/hooks/useGeolocation";
import MapView from "@/components/MapView";
import CreateDropModal from "@/components/CreateDropModal";
import DropDetail from "@/components/DropDetail";
import { isExpired } from "@/lib/geo";

export default function Home() {
  const { position, error, loading } = useGeolocation();
  const { profile } = useAuth();
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Phase 0: simple status="active" query (live via InstantDB). Phase 1
  // swaps this for the geohash7 9-cell query via useNearbyDrops.
  const { isLoading, data } = db.useQuery({
    drops: {
      $: {
        where: { status: "active" },
        order: { created_at: "desc" },
        limit: 100,
      },
    },
  });

  const drops = (data?.drops ?? []).filter((d) => !isExpired(d.expires_at));

  if (loading || (isLoading && !data)) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border border-primary/30 radar-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Scanning location...</p>
          <p className="text-xs text-muted-foreground mt-1">Enable GPS for the best experience</p>
        </div>
      </div>
    );
  }

  if (error && !position) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Location access needed</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Drop Radar needs your location to show nearby drops. Please enable location services.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapView
        position={position}
        drops={drops}
        onDropClick={setSelectedDrop}
        userPosition={position}
      />

      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
        <div className="flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="pointer-events-auto bg-card/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-border">
            <h1 className="text-sm font-bold tracking-wide">
              <span className="text-primary">Drop</span>
              <span className="text-foreground">Radar</span>
            </h1>
          </div>
          <div className="pointer-events-auto bg-card/90 backdrop-blur-xl rounded-2xl px-3 py-2.5 border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {drops.length} drops nearby
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500]">
        <Button
          onClick={() => setShowCreate(true)}
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg glow-cyan"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <CreateDropModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        position={position}
        profile={profile}
      />

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
