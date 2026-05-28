// One-off cleanup: delete the seed `profiles` rows that `create-instant-app`
// generated. Run once with `node scripts/clear-seed-profiles.mjs`, then push
// the schema. Safe to delete afterwards.
import { init } from "@instantdb/admin";
import { config } from "dotenv";
import schema from "../instant.schema.ts";

config({ path: ".env.local" });

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_ADMIN_TOKEN,
  schema,
});

const { profiles } = await db.query({ profiles: {} });
console.log(`Found ${profiles.length} profile(s).`);
if (profiles.length === 0) process.exit(0);

const ops = profiles.map((p) => db.tx.profiles[p.id].delete());
await db.transact(ops);
console.log(`Deleted ${profiles.length} profile(s).`);
