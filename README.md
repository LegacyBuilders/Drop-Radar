# Drop Radar

**Pokémon Go for creator drops.** Geo-locked file drops, gamified unlocks (vision / quiz / proximity / payment), and a link-in-bio that doesn't feel dated. Built to disrupt Linktree, Koji (RIP), and Stan.store at the same time.

- **85% / 90%** creator revenue share (Free / Pro)
- **Pro $12/mo** — undercuts Linktree Premium ($35), Stan ($29), Beacons Plus ($30)
- **InstantDB** (real-time DB + auth) + **Vercel** (hosting + Node serverless) + **Cloudflare R2** (media)
- **Strict-parity Phase 0** migration off Base44 (see `~/.claude/plans/we-are-building-a-humble-trinket.md` for the master plan)

## Quick start

```sh
npm install
cp .env.example .env.local
# Fill in INSTANT, STRIPE, R2 keys (see below)
npm run dev
```

App runs at `http://localhost:5173`. Vercel serverless functions in `/api/*` run via `vercel dev` (install the [Vercel CLI](https://vercel.com/docs/cli) first):

```sh
npm i -g vercel
vercel link
vercel dev
```

## Required services

**1. InstantDB** ([instantdb.com](https://instantdb.com))
- Create an app → copy the App ID → `VITE_INSTANT_APP_ID` and `INSTANT_APP_ID`.
- Generate an Admin Token → `INSTANT_ADMIN_TOKEN`.
- Push the schema + permissions:
  ```sh
  npx instant-cli@latest push --app $INSTANT_APP_ID
  ```

**2. Cloudflare R2** ([dash.cloudflare.com → R2](https://dash.cloudflare.com))
- Create a bucket called `drop-radar` (or whatever; match `R2_BUCKET`).
- Create an R2 API token with **Object Read & Write** on the bucket. Set `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`.
- Enable a public access URL (r2.dev domain or a custom CNAME like `cdn.dropradar.app`). Set `R2_PUBLIC_URL`.
- Add a CORS rule allowing `PUT` from your dev origin (`http://localhost:5173`) and prod origin.

**3. Stripe** ([dashboard.stripe.com](https://dashboard.stripe.com))
- Get test keys → `STRIPE_SECRET_KEY` (sk_test_...).
- For local webhook testing:
  ```sh
  stripe listen --forward-to localhost:3000/api/stripe-webhook
  # Copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET
  ```
- Stripe Connect (creator payouts) lands in Phase 1.

**4. Anthropic** (Phase 1+) — set `ANTHROPIC_API_KEY` when vision-unlock and AI vibe-coder ship.

## Project layout

```
api/                  Vercel serverless functions (Node runtime)
  _admin.js           Shared @instantdb/admin client + bearer-token verifier
  upload-url.js       R2 presigned PUT (quota-enforced)
  checkout.js         Stripe Checkout Session + pending transaction
  stripe-webhook.js   Reconciles tx, drops, tiers (source of truth for $)
instant.schema.ts     Entity + relations schema (InstantDB)
instant.perms.ts      CEL permission rules
src/
  lib/
    db.js             InstantDB React client
    auth.js           useAuth, ensureProfile, signOut
    storage.js        R2 upload dispatcher (client → presign → R2)
    geohash.js        encode / neighbors / prefixForZoom helpers
    geoQuery.js       useNearbyDrops — wired in Phase 1 (geohash7 9-cell)
    tier.js           Tier limits + commission + useTier hook
    geo.js            Haversine + expiration helpers
  pages/              Home, Nearby, Profile, CreatorDashboard,
                      PublicProfile, DropPage, Admin, SignIn
  components/         MapView, DropPin, NearbyDropCard, CreateDropModal,
                      DropDetail, FileViewer, Layout, ui/* (shadcn)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (UI only) |
| `vercel dev` | Vite + `/api/*` Node functions together |
| `npm run build` | Production build to `/dist` |
| `npm run typecheck` | TypeScript check via `jsconfig.json` |
| `npm run lint` | ESLint |

## Deploy

```sh
vercel deploy --prod
```

Set every env var from `.env.example` in the Vercel project settings. Configure the Stripe webhook endpoint `https://your-app.vercel.app/api/stripe-webhook` in the Stripe dashboard and copy the `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

## Roadmap

- **Phase 0 (now)** — Strict-parity migration off Base44. Same features, new stack.
- **Phase 1** — Geohash queries · vision/quiz unlocks (Claude) · Stripe Connect payouts · Pro tier subscription.
- **Phase 2** — AI vibe-coding agent for landing pages · scavenger hunts · bundles · custom domains · PWA · OG cards · analytics charts.
- **Phase 3** — PostGIS sidecar (geo density) · DMCA/CSAM pipeline · native wrapper · Enterprise dashboard.

See `~/.claude/plans/we-are-building-a-humble-trinket.md` for the full architecture, schema rationale, and competitive analysis.
