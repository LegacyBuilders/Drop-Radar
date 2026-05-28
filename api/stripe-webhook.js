// POST /api/stripe-webhook
//
// Reconciles Stripe events into InstantDB. Verifies the signature, then:
//   - checkout.session.completed     → complete transaction, credit creator,
//                                      decrement quantity, fire notification
//   - customer.subscription.created  → flip profile tier to "pro"
//   - customer.subscription.updated  → reflect status changes
//   - customer.subscription.deleted  → downgrade profile tier to "free"
//
// The webhook is the source of truth for tier + revenue. The browser is
// never trusted to flip these fields.
import Stripe from "stripe";
import { id } from "@instantdb/admin";
import { adminDb, jsonResponse } from "./_admin";
import { TIER, COMMISSION } from "../src/lib/tier";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires the raw body for signature verification.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return jsonResponse(res, 405, { error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (e) {
    return jsonResponse(res, 400, { error: `Signature: ${e.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCanceled(event.data.object);
        break;
      default:
        break;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Webhook handler error:", e);
    return jsonResponse(res, 500, { error: e.message });
  }

  return jsonResponse(res, 200, { received: true });
}

async function handleCheckoutCompleted(session) {
  const { drop_id, creator_email, creator_amount } = session.metadata || {};
  if (!drop_id) return;

  // Mark transaction completed.
  const { transactions } = await adminDb.query({
    transactions: { $: { where: { stripe_session_id: session.id } } },
  });
  const tx = transactions[0];
  if (tx) {
    await adminDb.transact(
      adminDb.tx.transactions[tx.id].update({
        status: "completed",
        stripe_payment_intent: session.payment_intent,
      })
    );
  }

  // Update drop revenue + quantity.
  const { drops } = await adminDb.query({ drops: { $: { where: { id: drop_id } } } });
  const drop = drops[0];
  if (drop) {
    const earned = parseFloat(creator_amount) / 100;
    const updates = {
      total_revenue: (drop.total_revenue || 0) + earned,
      download_count: (drop.download_count || 0) + 1,
      unlock_count: (drop.unlock_count || 0) + 1,
    };
    if (drop.quantity_remaining != null) {
      const remaining = drop.quantity_remaining - 1;
      updates.quantity_remaining = remaining;
      if (remaining <= 0) updates.status = "sold_out";
    }
    await adminDb.transact(adminDb.tx.drops[drop_id].update(updates));
  }

  // Credit creator earnings.
  if (creator_email) {
    const { profiles } = await adminDb.query({
      profiles: { $: { where: { "$user.email": creator_email } } },
    });
    const creator = profiles[0];
    if (creator) {
      const earned = parseFloat(creator_amount) / 100;
      await adminDb.transact(
        adminDb.tx.profiles[creator.id].update({
          total_earnings: (creator.total_earnings || 0) + earned,
          pending_earnings: (creator.pending_earnings || 0) + earned,
        })
      );

      // Fire notification.
      const notifId = id();
      await adminDb.transact(
        adminDb.tx.notifications[notifId]
          .update({
            kind: "sale",
            payload: {
              drop_id,
              drop_title: tx?.drop_title,
              amount: earned,
              buyer_email: session.customer_email,
            },
            read: false,
            created_at: Date.now(),
          })
          .link({ profile: creator.id })
      );
    }
  }
}

async function handleSubscriptionUpsert(sub) {
  const customerId = sub.customer;
  const status = sub.status;
  const isActive = status === "active" || status === "trialing";
  const periodEnd = (sub.current_period_end || 0) * 1000;

  const { profiles } = await adminDb.query({
    profiles: { $: { where: { stripe_customer_id: customerId } } },
  });
  const profile = profiles[0];
  if (!profile) return;

  const newTier = isActive ? TIER.PRO : TIER.FREE;
  const newRate = isActive ? COMMISSION.pro : COMMISSION.free;

  await adminDb.transact(
    adminDb.tx.profiles[profile.id].update({
      tier: newTier,
      commission_rate: newRate,
      tier_renews_at: periodEnd,
      stripe_subscription_id: sub.id,
    })
  );

  // Upsert subscription row.
  const { subscriptions } = await adminDb.query({
    subscriptions: { $: { where: { stripe_subscription_id: sub.id } } },
  });
  const existing = subscriptions[0];
  const subId = existing?.id ?? id();
  const ops = adminDb.tx.subscriptions[subId].update({
    stripe_subscription_id: sub.id,
    plan: sub.items?.data?.[0]?.price?.lookup_key || "pro_monthly",
    status,
    period_end: periodEnd,
  });
  await adminDb.transact(existing ? ops : ops.link({ profile: profile.id }));
}

async function handleSubscriptionCanceled(sub) {
  const { profiles } = await adminDb.query({
    profiles: { $: { where: { stripe_subscription_id: sub.id } } },
  });
  const profile = profiles[0];
  if (!profile) return;

  await adminDb.transact(
    adminDb.tx.profiles[profile.id].update({
      tier: TIER.FREE,
      commission_rate: COMMISSION.free,
      stripe_subscription_id: undefined,
    })
  );
}
