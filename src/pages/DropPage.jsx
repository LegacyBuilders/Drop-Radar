import { useParams, Link } from "react-router-dom";
import { Loader2, MapPin, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import useGeolocation from "@/hooks/useGeolocation";
import DropDetail from "@/components/DropDetail";

export default function DropPage() {
  const { dropId } = useParams();
  const { position } = useGeolocation();

  const { isLoading, data } = db.useQuery({
    drops: { $: { where: { id: dropId } } },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const drop = data?.drops?.[0];

  if (!drop) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3 text-center p-6">
        <MapPin className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drop not found or has expired</p>
        <Link to="/" className="text-xs text-primary underline">
          Open Drop Radar
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Link to="/" className="p-2 rounded-full hover:bg-secondary">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold">
            <span className="text-primary">Drop</span>Radar
          </h1>
          <p className="text-[10px] text-muted-foreground">Shared drop</p>
        </div>
      </div>

      <DropDetail
        drop={drop}
        onClose={() => {}}
        userPosition={position}
        isStandalone
      />
    </div>
  );
}
