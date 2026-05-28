import { db } from "./db";
import { id } from "@instantdb/react";
import { TIER, COMMISSION } from "./tier";

// Authentication helpers. Drop Radar uses InstantDB magic-code auth.
// The `useAuth` hook returns { user, profile, isLoading, isAuthenticated }
// where `profile` is the linked Drop Radar profile row (auto-created on
// first login via `ensureProfile`).

export function useAuth() {
  const { isLoading: authLoading, user, error } = db.useAuth();

  const profileQuery = user
    ? { profiles: { $: { where: { "$user.id": user.id } } } }
    : null;

  const { isLoading: profileLoading, data } = db.useQuery(profileQuery);

  const profile = data?.profiles?.[0] ?? null;

  return {
    isLoading: authLoading || (!!user && profileLoading),
    isAuthenticated: !!user,
    user,
    profile,
    error,
  };
}

// Idempotently create a default profile row + link to the $user.
// Call after a successful magic-code verification.
export async function ensureProfile(user) {
  if (!user) return;

  const existing = await db.queryOnce({
    profiles: { $: { where: { "$user.id": user.id } } },
  });
  if (existing.data.profiles.length > 0) return existing.data.profiles[0];

  const profileId = id();
  const now = Date.now();
  const fallbackUsername = `user_${user.id.slice(0, 8)}`;

  await db.transact(
    db.tx.profiles[profileId]
      .update({
        username: fallbackUsername,
        role: "user",
        is_verified: false,
        is_business: false,
        profile_template: "neon",
        tier: TIER.FREE,
        commission_rate: COMMISSION.free,
        follower_count: 0,
        following_count: 0,
        total_earnings: 0,
        pending_earnings: 0,
        storage_bytes_used: 0,
        ai_turns_used_month: 0,
        created_at: now,
      })
      .link({ $user: user.id })
  );

  return { id: profileId, username: fallbackUsername };
}

export async function signOut() {
  await db.auth.signOut();
}
