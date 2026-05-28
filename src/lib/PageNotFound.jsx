import { Link, useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary">
          <MapPin className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Out of range</h1>
          <p className="text-sm text-muted-foreground">
            {pageName ? `"${pageName}"` : "This page"} doesn&apos;t exist on Drop Radar.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/90"
        >
          Back to the map
        </Link>
      </div>
    </div>
  );
}
