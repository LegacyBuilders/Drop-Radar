import { db } from "./db";

// Drop Radar pricing tiers.
//
//   Free:       85% creator share, 1 GB storage, 10 active drops, basic templates.
//   Pro $12/mo: 90% creator share, 100 GB R2, unlimited drops, all unlock types,
//               AI vibe-coding (100 turns/mo), custom domain, no watermark,
//               scheduled drops, 5 boost tokens/mo, analytics CSV export.
//   Enterprise: contact sales — geo-fenced campaigns, multi-creator dashboards.
//
// `commission_rate` on the profile is the source of truth for the platform
// fee (0.15 free, 0.10 pro). It is only ever flipped by /api/stripe-webhook
// in response to a subscription event.

export const TIER = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

export const COMMISSION = {
  free: 0.15,
  pro: 0.1,
  enterprise: 0.1,
};

export const LIMITS = {
  free: {
    storage_bytes: 1 * 1024 * 1024 * 1024,
    active_drops: 10,
    max_upload_bytes: 50 * 1024 * 1024,
    ai_turns_per_month: 0,
    scheduled_drops: false,
    custom_domain: false,
    watermark: true,
    unlock_types: ["gps", "payment", "code"],
  },
  pro: {
    storage_bytes: 100 * 1024 * 1024 * 1024,
    active_drops: Infinity,
    max_upload_bytes: 500 * 1024 * 1024,
    ai_turns_per_month: 100,
    scheduled_drops: true,
    custom_domain: true,
    watermark: false,
    unlock_types: ["gps", "payment", "code", "vision", "quiz", "chain"],
  },
  enterprise: {
    storage_bytes: Infinity,
    active_drops: Infinity,
    max_upload_bytes: 5 * 1024 * 1024 * 1024,
    ai_turns_per_month: Infinity,
    scheduled_drops: true,
    custom_domain: true,
    watermark: false,
    unlock_types: ["gps", "payment", "code", "vision", "quiz", "chain", "campaign"],
  },
};

export function limitsFor(tier) {
  return LIMITS[tier] ?? LIMITS.free;
}

export function commissionFor(tier) {
  return COMMISSION[tier] ?? COMMISSION.free;
}

// React hook: returns { tier, limits, isPro, canUse } for the current user.
export function useTier(profile) {
  const tier = profile?.tier ?? TIER.FREE;
  const limits = limitsFor(tier);
  return {
    tier,
    limits,
    isPro: tier === TIER.PRO || tier === TIER.ENTERPRISE,
    canUse: (feature) => Boolean(limits[feature]),
    canUseUnlockType: (type) => limits.unlock_types.includes(type),
  };
}

// Read the current user's profile (with tier info) from InstantDB.
// Returns { profile, isLoading } — profile is null if the user is not signed in.
export function useCurrentProfile() {
  const { user } = db.useAuth();
  const { isLoading, data } = db.useQuery(
    user
      ? { profiles: { $: { where: { "$user.id": user.id } }, layout: {} } }
      : null
  );
  const profile = data?.profiles?.[0] ?? null;
  return { profile, isLoading: !!user && isLoading };
}
