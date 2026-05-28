import {
  User,
  MapPin,
  Eye,
  Heart,
  LogOut,
  Loader2,
  Package,
  TrendingUp,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth, signOut } from "@/lib/auth";

export default function Profile() {
  const { user, profile, isLoading } = useAuth();

  const dropsQuery = profile
    ? {
        drops: {
          $: {
            where: { creator_email: user?.email },
            order: { created_at: "desc" },
            limit: 50,
          },
        },
      }
    : null;
  const { isLoading: dropsLoading, data } = db.useQuery(dropsQuery);

  if (isLoading || (profile && dropsLoading)) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const myDrops = data?.drops ?? [];
  const totalViews = myDrops.reduce((s, d) => s + (d.view_count || 0), 0);
  const totalLikes = myDrops.reduce((s, d) => s + (d.like_count || 0), 0);
  const totalRevenue = profile?.total_earnings || 0;

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="bg-card border border-border rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {profile?.full_name || profile?.username || "User"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {profile?.username ? `@${profile.username}` : user?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: "Drops", value: myDrops.length, icon: Package },
              { label: "Views", value: totalViews, icon: Eye },
              { label: "Likes", value: totalLikes, icon: Heart },
              { label: "Earned", value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-secondary rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold font-mono text-foreground">{value}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <Link
            to="/creator"
            className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Creator Studio</p>
                <p className="text-xs text-muted-foreground">Analytics, earnings & profile</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {profile?.username && (
            <Link
              to={`/u/${profile.username}`}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Public Storefront</p>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </div>

        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          My Drops
        </h2>
        <div className="space-y-2">
          {myDrops.map((drop) => (
            <div
              key={drop.id}
              className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  drop.status === "active" ? "bg-primary/10" : "bg-destructive/10"
                }`}
              >
                <MapPin
                  className={`w-4 h-4 ${
                    drop.status === "active" ? "text-primary" : "text-destructive"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{drop.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {drop.view_count || 0} views ·{" "}
                  {drop.is_paid ? `$${drop.price}` : "Free"} · {drop.status}
                </p>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${
                  drop.status === "active"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {drop.is_geo_locked ? "geo" : "free"}
              </span>
            </div>
          ))}
          {myDrops.length === 0 && (
            <div className="text-center py-10">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No drops yet</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full mt-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
