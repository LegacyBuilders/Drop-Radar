import type { InstantRules } from "@instantdb/react";

// Drop Radar permission rules. Principle: clients read the public projection;
// sensitive fields are gated by grant rows; money/scoring/moderation writes
// only happen server-side via the Admin SDK.
//
// Note on CEL: `auth.ref(...)` and `data.ref(...)` traverse links and return
// LISTS, never scalars — even for `has: "one"` relations. Always compare with
// the `in` operator: `'admin' in auth.ref('$user.profile.role')`.
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
        "auth.id in data.ref('$user.id') || 'admin' in auth.ref('$user.profile.role')",
      delete: "'admin' in auth.ref('$user.profile.role')",
    },
  },

  drops: {
    allow: {
      view: "true",
      create:
        "auth.id != null && auth.email == newData.creator_email",
      update:
        "auth.email == data.creator_email || 'admin' in auth.ref('$user.profile.role')",
      delete:
        "auth.email == data.creator_email || 'admin' in auth.ref('$user.profile.role')",
    },
  },

  comments: {
    allow: {
      view: "true",
      create: "auth.id != null && auth.email == newData.user_email",
      update: "auth.email == data.user_email",
      delete:
        "auth.email == data.user_email || 'admin' in auth.ref('$user.profile.role')",
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
      update: "'admin' in auth.ref('$user.profile.role')",
      delete: "'admin' in auth.ref('$user.profile.role')",
    },
  },

  profileLayouts: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id in data.ref('profile.$user.id')",
      delete: "auth.id in data.ref('profile.$user.id')",
    },
  },

  links: {
    allow: {
      view: "true",
      create: "auth.id in newData.ref('profile.$user.id')",
      update: "auth.id in data.ref('profile.$user.id')",
      delete: "auth.id in data.ref('profile.$user.id')",
    },
  },

  // Money — server-only.
  transactions: {
    allow: {
      view:
        "auth.email == data.buyer_email || auth.email == data.creator_email || 'admin' in auth.ref('$user.profile.role')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  subscriptions: {
    allow: {
      view: "auth.id in data.ref('profile.$user.id')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  payouts: {
    allow: {
      view: "auth.id in data.ref('profile.$user.id')",
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
      view: "auth.email in data.ref('drop.creator_email')",
      create: "auth.email in newData.ref('drop.creator_email')",
      update: "auth.email in data.ref('drop.creator_email')",
      delete: "auth.email in data.ref('drop.creator_email')",
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
      update: "'admin' in auth.ref('$user.profile.role')",
      delete: "'admin' in auth.ref('$user.profile.role')",
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
      view: "auth.id in data.ref('profile.$user.id')",
      create: "false",
      update: "auth.id in data.ref('profile.$user.id')",
      delete: "auth.id in data.ref('profile.$user.id')",
    },
  },

  abuseReports: {
    allow: {
      view: "'admin' in auth.ref('$user.profile.role')",
      create: "auth.id != null && auth.email == newData.reporter_email",
      update: "'admin' in auth.ref('$user.profile.role')",
      delete: "'admin' in auth.ref('$user.profile.role')",
    },
  },

  aiSessions: {
    allow: {
      view: "auth.id in data.ref('profile.$user.id')",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
} satisfies InstantRules;

export default rules;
