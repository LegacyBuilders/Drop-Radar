// Shared Drop Radar admin context for Vercel serverless functions.
//
// The Instant Admin SDK bypasses CEL permissions — anything it writes lands
// directly in the database. Use it ONLY for trusted operations:
//   - Stripe webhook reconciliation (tx completion, drop revenue, tier flips)
//   - /api/upload-url quota enforcement
//   - /api/proximity-verify, /api/vision-verify, /api/quiz-grade grant rows
//   - cron jobs (expire, payouts, boost expiry)
//
// Never expose this client or its token to the browser.
import { init } from "@instantdb/admin";
import schema from "../instant.schema";

const APP_ID = process.env.INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  throw new Error(
    "Missing INSTANT_APP_ID or INSTANT_ADMIN_TOKEN. Set them in Vercel env vars."
  );
}

export const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema,
});

// Verify a bearer token from the Authorization header and return the user
// (throws if invalid). Use for endpoints that must know who is calling.
export async function requireUser(req) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) {
    const err = new Error("Missing bearer token");
    err.status = 401;
    throw err;
  }
  try {
    return await adminDb.auth.verifyToken(token);
  } catch (_e) {
    const err = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
}

export async function getProfileByEmail(email) {
  const { profiles } = await adminDb.query({
    profiles: { $: { where: { "$user.email": email } } },
  });
  return profiles[0] ?? null;
}

export function jsonResponse(res, status, payload) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
