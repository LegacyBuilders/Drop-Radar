import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Instagram,
  Twitter,
  Globe,
  UserPlus,
  UserCheck,
  Verified,
  Package,
  Eye,
  Heart,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { isExpired } from "@/lib/geo";
import { useTier } from "@/lib/tier";
import DropDetail from "@/components/DropDetail";

const TEMPLATE_THEMES = {
  minimal: { bg: "bg-background", card: "bg-card border border-border", accent: "text-primary" },
  bold: { bg: "bg-slate-950", card: "bg-slate-900 border border-slate-800", accent: "text-amber-400" },
  neon: { bg: "bg-background", card: "bg-card border border-primary/20", accent: "text-primary" },
  soft: { bg: "bg-background", card: "bg-secondary border-none", accent: "text-foreground" },
};

export default function PublicProfile() {
  const { username } = useParams();
  const [selectedDrop, setSelectedDrop] = useState(null);
  const { user: currentUser, profile: currentProfile } = useAuth();

  const { isLoading, data } = db.useQuery({
    profiles: {
      $: { where: { username } },
      $user: {},
      drops: { $: { where: { status: "active" }, order: { created_at: "desc" }, limit: 50 } },
    },
  });

  const profileUser = data?.profiles?.[0];
  const drops = (profileUser?.drops ?? []).filter((d) => !isExpired(d.expires_at));

  // Watermark shows for free-tier creators (Pro removes it).
  const { limits: profileLimits } = useTier(profileUser);

  // Is current user following the profileUser? Query separately to keep
  // namespacing simple.
  const followsQuery =
    currentProfile && profileUser && currentProfile.id !== profileUser.id
      ? {
          follows: {
            $: {
              where: {
                follower_email: currentUser.email,
                following_email: profileUser.$user?.email,
              },
              limit: 1,
            },
          },
        }
      : null;
  const { data: followsData } = db.useQuery(followsQuery);
  const followRow = followsData?.follows?.[0];
  const isFollowing = !!followRow;

  const handleFollow = async () => {
    if (!currentProfile) {
      window.location.href = "/";
      return;
    }
    if (isFollowing) {
      await db.transact(db.tx.follows[followRow.id].delete());
    } else {
      const followId = id();
      await db.transact(
        db.tx.follows[followId]
          .update({
            follower_email: currentUser.email,
            following_email: profileUser.$user?.email,
            following_username: profileUser.username,
            created_at: Date.now(),
          })
          .link({ follower: currentProfile.id, following: profileUser.id })
      );
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3 text-center p-6">
        <p className="text-2xl font-bold text-foreground">@{username}</p>
        <p className="text-sm text-muted-foreground">This profile doesn&apos;t exist yet</p>
        <Link to="/" className="text-xs text-primary underline">
          Back to Drop Radar
        </Link>
      </div>
    );
  }

  const theme = TEMPLATE_THEMES[profileUser.profile_template || "neon"];
  const socialLinks = profileUser.social_links || {};
  const featuredDrops = drops.filter((d) => d.is_featured);
  const allDrops = drops;
  const isOwnProfile = currentProfile?.id === profileUser.id;

  return (
    <div className={`min-h-screen ${theme.bg} pb-10`}>
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
        <div className="px-5 pb-0 -mt-10">
          <div className="flex items-end justify-between mb-4">
            <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-3xl">
              {profileUser.avatar_url ? (
                <img
                  src={profileUser.avatar_url}
                  alt=""
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{profileUser.full_name?.[0]?.toUpperCase() || profileUser.username?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                size="sm"
                className={`rounded-xl ${
                  isFollowing
                    ? "bg-secondary text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 mr-1" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 mr-1" /> Follow
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-foreground">
              {profileUser.full_name || profileUser.username}
            </h1>
            {profileUser.is_verified && (
              <Verified className="w-4 h-4 text-primary fill-primary" />
            )}
            {profileUser.is_business && (
              <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                Business
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
          {profileUser.bio && (
            <p className="text-sm text-foreground mt-2">{profileUser.bio}</p>
          )}

          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{allDrops.length}</strong> drops
            </span>
            <span>
              <strong className="text-foreground">{profileUser.follower_count || 0}</strong>{" "}
              followers
            </span>
            <span>
              <strong className="text-foreground">
                {allDrops.reduce((s, d) => s + (d.view_count || 0), 0)}
              </strong>{" "}
              views
            </span>
          </div>

          {(socialLinks.instagram || socialLinks.twitter || socialLinks.website) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {socialLinks.instagram && (
                <a
                  href={`https://instagram.com/${socialLinks.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="w-3 h-3" /> @{socialLinks.instagram}
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-3 h-3" /> @{socialLinks.twitter}
                </a>
              )}
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-6">
        {featuredDrops.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
              ✨ Featured
            </h2>
            <div className="space-y-3">
              {featuredDrops.map((drop) => (
                <DropCard key={drop.id} drop={drop} onClick={() => setSelectedDrop(drop)} />
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          All Drops
        </h2>
        {allDrops.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No drops yet</p>
          </div>
        )}
        <div className="space-y-3">
          {allDrops.map((drop) => (
            <DropCard key={drop.id} drop={drop} onClick={() => setSelectedDrop(drop)} />
          ))}
        </div>

        {profileLimits.watermark && (
          <div className="mt-10 text-center">
            <Link
              to="/"
              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
            >
              Made on <span className="text-primary">Drop</span>Radar
            </Link>
          </div>
        )}
      </div>

      {selectedDrop && (
        <DropDetail
          drop={selectedDrop}
          onClose={() => setSelectedDrop(null)}
          userPosition={null}
        />
      )}
    </div>
  );
}

function DropCard({ drop, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
    >
      {drop.preview_url && (
        <div className="relative">
          <img
            src={drop.preview_url}
            alt=""
            className="w-full h-40 object-cover"
            style={drop.is_paid ? { filter: "blur(8px) brightness(0.7)" } : {}}
          />
          {drop.is_paid && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{drop.title}</p>
            {drop.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {drop.description}
              </p>
            )}
          </div>
          {drop.is_paid && (
            <span className="ml-2 text-sm font-bold font-mono text-chart-3 flex-shrink-0">
              ${drop.price}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" /> {drop.view_count || 0}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart className="w-3 h-3" /> {drop.like_count || 0}
          </span>
          {drop.is_geo_locked && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> Geo
            </span>
          )}
          {drop.quantity_limit && (
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">
              {drop.quantity_remaining ?? drop.quantity_limit} left
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
