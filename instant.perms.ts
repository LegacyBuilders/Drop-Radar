import type { InstantRules } from "@instantdb/react";

// Drop Radar permission rules. Principle: clients read the public projection;
// sensitive fields are gated by grant rows; money/scoring/moderation writes
// only happen server-side via the Admin SDK.
//
// Phase 0: simple ownership/admin rules. Phase 1 layers in per-field gates for
// drops.file_url (proximityGrants / visionProofs / transactions / quizAttempts).
const rules = {
  $default: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "false",
      delete: "false",
    },
  },

  profiles: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update:
        "auth.id == data.ref('$user.id') || auth.ref('$user.profile.role') == 'admin'",
      delete: "auth.ref('$user.profile.role') == 'admin'",
    },
  },

  drops: {
    allow: {
      view: "true",
      create:
        "auth.id != null && auth.email == newData.creator_email",
      update:
        "auth.email == data.creator_email || auth.ref('$user.profile.role') == 'admin'",
      delete:
        "auth.email == data.creator_email || auth.ref('$user.profile.role') == 'admin'",
    },
  },

  comments: {
    allow: {
      view: "true",
      create: "auth.id != null && auth.email == newData.user_email",
      update: "auth.email == data.user_email",
      delete:
        "auth.email == data.user_email || auth.ref('$user.profile.role') == 'admin'",
    },
  },

  reactions: {
    allow: {
      view: "true",
      create: "auth.id != null && auth.email == newData.user_email",
      delete: "auth.email == data.user_email",
    },
  },

  follows: {
    allow: {
      view: "true",
      create:
        "auth.id != null && auth.email == newData.follower_email",
      delete: "auth.email == data.follower_email",
    },
  },

  bundles: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.ref('$user.profile.role') == 'admin'",
      delete: "auth.ref('$user.profile.role') == 'admin'",
    },
  },

  profileLayouts: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id == data.ref('profile.$user.id')",
      delete: "auth.id == data.ref('profile.$user.id')",
    },
  },

  links: {
    allow: {
      view: "true",
      create: "auth.id == newData.ref('profile.$user.id')",
      update: "auth.id == data.ref('profile.$user.id')",
      delete: "auth.id == data.ref('profile.$user.id')",
    },
  },

  // Money — server-only.
  transactions: {
    allow: {
      view:
        "auth.email == data.buyer_email || auth.email == data.creator_email || auth.ref('$user.profile.role') == 'admin'",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  subscriptions: {
    allow: {
      view: "auth.id == data.ref('profile.$user.id')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  payouts: {
    allow: {
      view: "auth.id == data.ref('profile.$user.id')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  // Unlock primitives — server-only writes.
  proximityGrants: {
    allow: {
      view: "auth.email == data.user_email",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  quizzes: {
    // Answer keys never reach a non-creator client.
    allow: {
      view: "auth.email == data.ref('drop.creator_email')",
      create: "auth.email == newData.ref('drop.creator_email')",
      update: "auth.email == data.ref('drop.creator_email')",
      delete: "auth.email == data.ref('drop.creator_email')",
    },
  },

  quizAttempts: {
    allow: {
      view: "auth.email == data.user_email",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  visionProofs: {
    allow: {
      view: "auth.email == data.user_email",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  scavengerHunts: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.ref('$user.profile.role') == 'admin'",
      delete: "auth.ref('$user.profile.role') == 'admin'",
    },
  },

  huntProgress: {
    allow: {
      view: "auth.email == data.user_email",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  notifications: {
    allow: {
      view: "auth.id == data.ref('profile.$user.id')",
      create: "false",
      update: "auth.id == data.ref('profile.$user.id')",
      delete: "auth.id == data.ref('profile.$user.id')",
    },
  },

  abuseReports: {
    allow: {
      view: "auth.ref('$user.profile.role') == 'admin'",
      create: "auth.id != null && auth.email == newData.reporter_email",
      update: "auth.ref('$user.profile.role') == 'admin'",
      delete: "auth.ref('$user.profile.role') == 'admin'",
    },
  },

  aiSessions: {
    allow: {
      view: "auth.id == data.ref('profile.$user.id')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
} satisfies InstantRules;

export default rules;
