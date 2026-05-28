import { useState, useEffect } from "react";
import {
  DollarSign,
  Eye,
  Download,
  Heart,
  Package,
  Loader2,
  Edit2,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useTier } from "@/lib/tier";

export default function CreatorDashboard() {
  const { user, profile, isLoading } = useAuth();
  const { isPro } = useTier(profile);

  const [editingProfile, setEditingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    const social = profile.social_links || {};
    setInstagram(social.instagram || "");
    setTwitter(social.twitter || "");
    setWebsite(social.website || "");
  }, [profile?.id]);

  const dropsQuery = profile
    ? {
        drops: {
          $: {
            where: { creator_email: user?.email },
            order: { created_at: "desc" },
            limit: 100,
          },
        },
      }
    : null;
  const { data: dropsData } = db.useQuery(dropsQuery);

  const txQuery = profile
    ? {
        transactions: {
          $: {
            where: { creator_email: user?.email, status: "completed" },
            order: { created_at: "desc" },
            limit: 50,
          },
        },
      }
    : null;
  const { data: txData } = db.useQuery(txQuery);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await db.transact(
      db.tx.profiles[profile.id].update({
        username: username || undefined,
        bio: bio || undefined,
        social_links: { instagram, twitter, website },
      })
    );
    setSaving(false);
    setEditingProfile(false);
  };

  const copyProfileLink = async () => {
    if (!profile?.username) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/u/${profile.username}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !profile) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const drops = dropsData?.drops ?? [];
  const transactions = txData?.transactions ?? [];

  const totalRevenue = transactions.reduce((s, t) => s + (t.creator_amount || 0), 0);
  const totalViews = drops.reduce((s, d) => s + (d.view_count || 0), 0);
  const totalDownloads = drops.reduce((s, d) => s + (d.download_count || 0), 0);
  const totalLikes = drops.reduce((s, d) => s + (d.like_count || 0), 0);

  const STATS = [
    { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-chart-3" },
    { label: "Views", value: totalViews, icon: Eye, color: "text-primary" },
    { label: "Downloads", value: totalDownloads, icon: Download, color: "text-chart-2" },
    { label: "Likes", value: totalLikes, icon: Heart, color: "text-rose-400" },
  ];

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Creator Studio</h1>
            <p className="text-xs text-muted-foreground">Manage your drops & earnings</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingProfile(!editingProfile)}
            className="gap-1.5 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        </div>

        {profile?.username && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Your storefront</p>
              <p className="text-sm font-mono text-primary truncate">
                dropradar.app/u/{profile.username}
              </p>
            </div>
            <button
              onClick={copyProfileLink}
              className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-primary" />
              )}
            </button>
          </div>
        )}

        {editingProfile && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 space-y-3">
            <h3 className="text-sm font-medium">Edit Profile</h3>
            <div>
              <label className="text-xs text-muted-foreground">Username</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  @
                </span>
                <Input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                  }
                  placeholder="yourname"
                  className="bg-secondary border-none pl-7 h-10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bio</label>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about yourself..."
                className="bg-secondary border-none h-10 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Instagram</label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@handle"
                  className="bg-secondary border-none h-9 mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Twitter/X</label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@handle"
                  className="bg-secondary border-none h-9 mt-1 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Website</label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="bg-secondary border-none h-9 mt-1 text-xs"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full h-10 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-5">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-chart-3/5 border border-chart-3/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Commission rate</p>
              <p className="text-lg font-bold text-chart-3 font-mono">
                {isPro ? "10%" : "15%"} platform
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">You keep</p>
              <p className="text-lg font-bold text-foreground font-mono">
                {isPro ? "90%" : "85%"}
              </p>
            </div>
          </div>
          {!isPro && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Upgrade to Pro ($12/mo) → keep 90% + custom domain + AI vibe-coding + 100GB storage
            </p>
          )}
        </div>

        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Drop Performance
        </h2>
        <div className="space-y-2 mb-5">
          {drops.slice(0, 10).map((drop) => (
            <div
              key={drop.id}
              className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  drop.is_paid ? "bg-chart-3/10" : "bg-primary/10"
                }`}
              >
                {drop.is_paid ? (
                  <DollarSign className="w-4 h-4 text-chart-3" />
                ) : (
                  <Package className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{drop.title}</p>
                <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span>
                    <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                    {drop.view_count || 0}
                  </span>
                  <span>
                    <Download className="w-2.5 h-2.5 inline mr-0.5" />
                    {drop.download_count || 0}
                  </span>
                  {drop.is_paid && (
                    <span className="text-chart-3">
                      ${(drop.total_revenue || 0).toFixed(2)} earned
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] font-mono ${
                  drop.status === "active" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {drop.status}
              </span>
            </div>
          ))}
          {drops.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No drops yet</p>
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recent Sales
            </h2>
            <div className="space-y-2">
              {transactions.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {t.drop_title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t.buyer_email}</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-chart-3">
                    +${t.creator_amount?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
