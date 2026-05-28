// POST /api/checkout
//
// Creates a Stripe Checkout Session for a paid drop and records a pending
// `transactions` row in InstantDB. The session metadata threads through to
// /api/stripe-webhook for completion.
//
// Phase 0: single-account checkout (Drop Radar holds funds, settles to
// creators off-platform). Phase 1 switches to Stripe Connect destination
// charges so creators are paid directly.
//
// Request:  { drop_id, success_url, cancel_url }
// Response: { checkout_url, session_id }
import Stripe from "stripe";
import { id } from "@instantdb/admin";
import { adminDb, requireUser, jsonResponse } from "./_admin";
import { commissionFor } from "../src/lib/tier";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return jsonResponse(res, 405, { error: "Method not allowed" });

  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    return jsonResponse(res, e.status || 401, { error: e.message });
  }

  const { drop_id, success_url, cancel_url } = req.body || {};
  if (!drop_id) return jsonResponse(res, 400, { error: "drop_id required" });

  const { drops } = await adminDb.query({
    drops: { $: { where: { id: drop_id } }, creator: {} },
  });
  const drop = drops[0];
  if (!drop) return jsonResponse(res, 404, { error: "Drop not found" });
  if (!drop.price || drop.price <= 0)
    return jsonResponse(res, 400, { error: "This drop is free" });
  if (drop.status === "sold_out")
    return jsonResponse(res, 409, { error: "Sold out" });

  const creatorProfile = drop.creator?.[0] ?? drop.creator;
  const commission = commissionFor(creatorProfile?.tier);
  const creatorAmount = Math.round(drop.price * (1 - commission) * 100);
  const platformFee = Math.round(drop.price * commission * 100);

  const origin = req.headers.origin || `https://${req.headers.host || "dropradar.app"}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: drop.title,
            description: drop.description || "Exclusive drop on Drop Radar",
            metadata: { drop_id: drop.id },
          },
          unit_amount: Math.round(drop.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: user.email,
    success_url: success_url || `${origin}/drop/${drop.id}?payment=success`,
    cancel_url: cancel_url || `${origin}/drop/${drop.id}?payment=cancelled`,
    metadata: {
      drop_id: drop.id,
      buyer_email: user.email,
      creator_email: drop.creator_email,
      creator_amount: String(creatorAmount),
      platform_fee: String(platformFee),
    },
  });

  const txId = id();
  const txOps = adminDb.tx.transactions[txId]
    .update({
      drop_id: drop.id,
      drop_title: drop.title,
      buyer_email: user.email,
      creator_email: drop.creator_email,
      amount_usd: drop.price,
      creator_amount: creatorAmount / 100,
      platform_fee: platformFee / 100,
      stripe_session_id: session.id,
      status: "pending",
      created_at: Date.now(),
    })
    .link({ drop: drop.id });

  await adminDb.transact(txOps);

  return jsonResponse(res, 200, { checkout_url: session.url, session_id: session.id });
}
