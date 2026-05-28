import { useState } from "react";
import { Shield, Trash2, Flag, Users, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";

export default function Admin() {
  const { profile, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState("drops");

  const isAdmin = profile?.role === "admin";

  const { isLoading, data } = db.useQuery(
    isAdmin
      ? {
          drops: { $: { order: { created_at: "desc" }, limit: 200 } },
          profiles: { $: { order: { created_at: "desc" }, limit: 100 } },
        }
      : null
  );

  const updateDropStatus = async (dropId, status) => {
    await db.transact(db.tx.drops[dropId].update({ status }));
  };

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background gap-3">
        <Shield className="w-10 h-10 text-destructive" />
        <p className="text-sm text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const drops = data?.drops ?? [];
  const profiles = data?.profiles ?? [];
  const totalViews = drops.reduce((sum, d) => sum + (d.view_count || 0), 0);

  const tabs = [
    { id: "drops", label: "Drops", icon: Package },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage Drop Radar</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold font-mono text-foreground">{drops.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Drops</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold font-mono text-foreground">{profiles.length}</p>
            <p className="text-[10px] text-muted-foreground">Users</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold font-mono text-foreground">{totalViews}</p>
            <p className="text-[10px] text-muted-foreground">Views</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "drops" && (
          <div className="space-y-2">
            {drops.map((drop) => (
              <div key={drop.id} className="bg-card border border-border rounded-2xl p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {drop.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      by {drop.owner_name || drop.creator_email || "Unknown"} ·{" "}
                      {drop.view_count || 0} views
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ml-2 ${
                      drop.status === "active"
                        ? "bg-primary/10 text-primary"
                        : drop.status === "flagged"
                        ? "bg-neon-yellow/10 text-neon-yellow"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {drop.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {drop.status === "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateDropStatus(drop.id, "flagged")}
                      className="h-7 text-[10px] text-neon-yellow hover:text-neon-yellow"
                    >
                      <Flag className="w-3 h-3 mr-1" /> Flag
                    </Button>
                  )}
                  {drop.status !== "removed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateDropStatus(drop.id, "removed")}
                      className="h-7 text-[10px] text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-2">
            {profiles.map((u) => (
              <div
                key={u.id}
                className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.full_name || u.username || "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    @{u.username} · {u.tier || "free"}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground">
                  {u.role || "user"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
