import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),

    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),

    profiles: i.entity({
      username: i.string().unique().indexed(),
      full_name: i.string().optional(),
      bio: i.string().optional(),
      avatar_url: i.string().optional(),
      role: i.string().indexed(),                       // user | creator | business | admin
      is_verified: i.boolean(),
      is_business: i.boolean(),
      profile_template: i.string(),                     // minimal | bold | neon | soft | custom
      accent_color: i.string().optional(),
      social_links: i.json().optional(),
      tier: i.string().indexed(),                       // free | pro | enterprise
      tier_renews_at: i.date().optional(),
      stripe_customer_id: i.string().optional(),
      stripe_account_id: i.string().optional(),
      stripe_subscription_id: i.string().optional(),
      commission_rate: i.number(),                      // 0.15 free, 0.10 pro
      follower_count: i.number(),
      following_count: i.number(),
      total_earnings: i.number(),
      pending_earnings: i.number(),
      storage_bytes_used: i.number(),
      ai_turns_used_month: i.number(),
      custom_domain: i.string().unique().optional().indexed(),
      created_at: i.date().indexed(),
    }),

    drops: i.entity({
      title: i.string(),
      description: i.string().optional(),
      file_url: i.string().optional(),
      preview_url: i.string().optional(),
      file_type: i.string(),                            // image | video | audio | pdf | other
      file_name: i.string().optional(),
      file_size: i.number().optional(),
      storage_backend: i.string(),                      // "r2"
      latitude: i.number(),
      longitude: i.number(),
      radius_meters: i.number(),
      geohash7: i.string().indexed(),                   // ~153m cell
      geohash5: i.string().indexed(),                   // ~5km cell
      is_geo_locked: i.boolean(),
      expiration: i.string().optional(),                // 15min | 1hr | 24hr | permanent
      expires_at: i.date().optional().indexed(),
      visibility: i.string().indexed(),                 // public | private
      access_code_hash: i.string().optional(),
      template_type: i.string(),                        // standard | digital_product | exclusive_content | event_drop | treasure_hunt | portfolio
      unlock_rules: i.json(),                           // [{type, ...}]
      unlock_chain_id: i.string().optional().indexed(),
      owner_name: i.string().optional(),
      owner_username: i.string().optional(),
      is_anonymous: i.boolean(),
      creator_email: i.string().indexed(),              // denormalized for filtering
      is_paid: i.boolean(),
      price: i.number(),
      currency: i.string(),
      quantity_limit: i.number().optional(),
      quantity_remaining: i.number().optional(),
      view_count: i.number(),
      like_count: i.number(),
      download_count: i.number(),
      unlock_count: i.number(),
      total_revenue: i.number(),
      referral_code: i.string().optional(),
      status: i.string().indexed(),                     // active | expired | flagged | removed | sold_out | draft
      is_featured: i.boolean(),
      boost_expires_at: i.date().optional().indexed(),
      scheduled_for: i.date().optional().indexed(),
      created_at: i.date().indexed(),
    }),

    bundles: i.entity({
      title: i.string(),
      description: i.string().optional(),
      bundle_type: i.string(),                          // album | course | gallery | zip
      cover_url: i.string().optional(),
      item_order: i.json(),                             // [dropId, ...]
      created_at: i.date().indexed(),
    }),

    profileLayouts: i.entity({
      theme: i.json(),
      blocks: i.json(),                                 // ordered block array
      version: i.number(),
      published_at: i.date().optional(),
      ai_metadata: i.json().optional(),
      updated_at: i.date(),
    }),

    links: i.entity({
      kind: i.string(),                                 // link | embed | drop_ref | header | divider | product
      label: i.string().optional(),
      url: i.string().optional(),
      drop_id: i.string().optional().indexed(),
      order: i.number(),
      style: i.json().optional(),
      click_count: i.number(),
    }),

    transactions: i.entity({
      drop_id: i.string().indexed(),
      drop_title: i.string().optional(),
      buyer_email: i.string().indexed(),
      creator_email: i.string().indexed(),
      amount_usd: i.number(),
      creator_amount: i.number(),
      platform_fee: i.number(),
      stripe_session_id: i.string().unique(),
      stripe_payment_intent: i.string().optional(),
      status: i.string().indexed(),                     // pending | completed | refunded | failed
      referral_code: i.string().optional(),
      created_at: i.date().indexed(),
    }),

    follows: i.entity({
      follower_email: i.string().indexed(),
      following_email: i.string().indexed(),
      following_username: i.string().optional(),
      created_at: i.date(),
    }),

    reactions: i.entity({
      drop_id: i.string().indexed(),
      user_email: i.string().indexed(),
      kind: i.string(),                                 // like | fire | mind_blown | love
      created_at: i.date(),
    }),

    comments: i.entity({
      drop_id: i.string().indexed(),
      user_email: i.string(),
      author_name: i.string().optional(),
      text: i.string(),
      created_at: i.date().indexed(),
    }),

    // Unlock primitives (Phase 1)
    proximityGrants: i.entity({
      drop_id: i.string().indexed(),
      user_email: i.string().indexed(),
      gps_accuracy_m: i.number(),
      verified_at: i.date(),
      expires_at: i.date(),
    }),

    quizzes: i.entity({
      drop_id: i.string().indexed(),
      questions: i.json(),
      pass_threshold: i.number(),
      attempts_allowed: i.number(),
    }),

    quizAttempts: i.entity({
      quiz_id: i.string().indexed(),
      user_email: i.string().indexed(),
      score: i.number(),
      passed: i.boolean(),
      created_at: i.date(),
    }),

    visionProofs: i.entity({
      drop_id: i.string().indexed(),
      user_email: i.string().indexed(),
      image_url: i.string(),
      prompt: i.string(),
      verdict: i.string(),                              // pending | approved | rejected
      claude_response: i.json().optional(),
      created_at: i.date(),
    }),

    scavengerHunts: i.entity({
      title: i.string(),
      step_order: i.json(),
      reward_drop_id: i.string().optional(),
      created_at: i.date(),
    }),

    huntProgress: i.entity({
      hunt_id: i.string().indexed(),
      user_email: i.string().indexed(),
      current_step: i.number(),
      completed_at: i.date().optional(),
    }),

    // Platform (Phase 1+)
    subscriptions: i.entity({
      stripe_subscription_id: i.string().unique(),
      plan: i.string(),                                 // pro_monthly | pro_yearly | enterprise
      status: i.string().indexed(),                     // active | past_due | canceled
      period_end: i.date(),
    }),

    payouts: i.entity({
      amount_usd: i.number(),
      stripe_transfer_id: i.string().optional(),
      status: i.string().indexed(),                     // queued | sent | failed
      created_at: i.date().indexed(),
    }),

    notifications: i.entity({
      kind: i.string(),                                 // unlock | comment | sale | follow | moderation
      payload: i.json(),
      read: i.boolean().indexed(),
      created_at: i.date().indexed(),
    }),

    abuseReports: i.entity({
      target_kind: i.string(),                          // drop | profile | comment
      target_id: i.string().indexed(),
      reporter_email: i.string(),
      reason: i.string(),
      status: i.string().indexed(),                     // open | reviewed | actioned
      created_at: i.date(),
    }),

    aiSessions: i.entity({
      tool_calls: i.json(),
      transcript: i.json(),
      tokens_used: i.number(),
      created_at: i.date().indexed(),
    }),
  },

  links: {
    profileUser: {
      forward: { on: "profiles", has: "one", label: "$user", required: true },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    dropCreator: {
      forward: { on: "drops", has: "one", label: "creator", required: true },
      reverse: { on: "profiles", has: "many", label: "drops" },
    },
    layoutOwner: {
      forward: { on: "profileLayouts", has: "one", label: "profile", required: true },
      reverse: { on: "profiles", has: "one", label: "layout" },
    },
    linkOwner: {
      forward: { on: "links", has: "one", label: "profile", required: true },
      reverse: { on: "profiles", has: "many", label: "links" },
    },
    bundleOwner: {
      forward: { on: "bundles", has: "one", label: "creator", required: true },
      reverse: { on: "profiles", has: "many", label: "bundles" },
    },
    txBuyer: {
      forward: { on: "transactions", has: "one", label: "buyer" },
      reverse: { on: "profiles", has: "many", label: "purchases" },
    },
    txDrop: {
      forward: { on: "transactions", has: "one", label: "drop", required: true },
      reverse: { on: "drops", has: "many", label: "transactions" },
    },
    followFollower: {
      forward: { on: "follows", has: "one", label: "follower", required: true },
      reverse: { on: "profiles", has: "many", label: "following_edges" },
    },
    followFollowing: {
      forward: { on: "follows", has: "one", label: "following", required: true },
      reverse: { on: "profiles", has: "many", label: "follower_edges" },
    },
    reactionDrop: {
      forward: { on: "reactions", has: "one", label: "drop", required: true },
      reverse: { on: "drops", has: "many", label: "reactions" },
    },
    reactionUser: {
      forward: { on: "reactions", has: "one", label: "user", required: true },
      reverse: { on: "profiles", has: "many", label: "reactions" },
    },
    commentDrop: {
      forward: { on: "comments", has: "one", label: "drop", required: true },
      reverse: { on: "drops", has: "many", label: "comments" },
    },
    commentUser: {
      forward: { on: "comments", has: "one", label: "user", required: true },
      reverse: { on: "profiles", has: "many", label: "comments" },
    },
    proxUser: {
      forward: { on: "proximityGrants", has: "one", label: "user", required: true },
      reverse: { on: "profiles", has: "many", label: "proximityGrants" },
    },
    proxDrop: {
      forward: { on: "proximityGrants", has: "one", label: "drop", required: true },
      reverse: { on: "drops", has: "many", label: "proximityGrants" },
    },
    quizDrop: {
      forward: { on: "quizzes", has: "one", label: "drop", required: true },
      reverse: { on: "drops", has: "one", label: "quiz" },
    },
    quizAttemptQuiz: {
      forward: { on: "quizAttempts", has: "one", label: "quiz", required: true },
      reverse: { on: "quizzes", has: "many", label: "attempts" },
    },
    quizAttemptUser: {
      forward: { on: "quizAttempts", has: "one", label: "user", required: true },
      reverse: { on: "profiles", has: "many", label: "quizAttempts" },
    },
    visionDrop: {
      forward: { on: "visionProofs", has: "one", label: "drop", required: true },
      reverse: { on: "drops", has: "many", label: "visionProofs" },
    },
    visionUser: {
      forward: { on: "visionProofs", has: "one", label: "user", required: true },
      reverse: { on: "profiles", has: "many", label: "visionProofs" },
    },
    aiSessionOwner: {
      forward: { on: "aiSessions", has: "one", label: "profile", required: true },
      reverse: { on: "profiles", has: "many", label: "aiSessions" },
    },
    notificationOwner: {
      forward: { on: "notifications", has: "one", label: "profile", required: true },
      reverse: { on: "profiles", has: "many", label: "notifications" },
    },
    payoutOwner: {
      forward: { on: "payouts", has: "one", label: "profile", required: true },
      reverse: { on: "profiles", has: "many", label: "payouts" },
    },
    subscriptionOwner: {
      forward: { on: "subscriptions", has: "one", label: "profile", required: true },
      reverse: { on: "profiles", has: "one", label: "subscription" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
