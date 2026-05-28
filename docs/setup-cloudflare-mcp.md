# Cloudflare MCP — One-Time Setup

Drop Radar uses the Cloudflare **remote** MCP servers (not local) so Claude
Code agents can provision and tune R2 buckets, Workers, KV, and D1 with your
account's permissions. The config is already in `.mcp.json` at the project
root. You just need to authorize it.

## Steps

1. **Restart Claude Code** in this directory (`C:\Users\Legacy\drop-radar`).
   On launch it discovers `.mcp.json` and prompts to start the registered
   servers.

2. **Approve the Cloudflare server** when Claude Code asks. It will run
   `npx mcp-remote@latest https://bindings.mcp.cloudflare.com/sse`, which opens
   your default browser for the OAuth flow.

3. **Sign in to Cloudflare** in the browser. Grant access to your account
   (the one that owns the `drop-radar` R2 bucket). Token is stored locally by
   `mcp-remote`; it does **not** appear in any transcript.

4. **Verify connection** — back in Claude Code, run:
   ```
   /mcp
   ```
   You should see `cloudflare` and `cloudflare-docs` listed as ✅ connected.

5. **Tell the agent what to do**. With the MCP active, ask:
   > "Configure the `drop-radar` R2 bucket for Phase 0: CORS allowing PUT
   > from `localhost:5173` and `*.vercel.app` and `dropradar.app`, lifecycle
   > rule deleting incomplete multipart uploads after 7 days, and generate an
   > R2 access key pair scoped to that bucket only. Write the resulting
   > `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, and
   > `R2_PUBLIC_URL` into `.env.local`."

   The agent will use the MCP `accounts_list`, `r2_buckets_list`,
   `r2_bucket_get`, `r2_bucket_cors_set`, and similar tools to do it without
   you copy-pasting keys.

## What lives behind the MCP

- **`bindings.mcp.cloudflare.com/sse`** — provisioning + querying for R2,
  Workers, KV, D1, Queues, Hyperdrive, Vectorize, R2 SQL. This is the one
  that mutates resources.
- **`docs.mcp.cloudflare.com/sse`** — searches the Cloudflare docs without
  needing to leave Claude Code. Read-only, no auth scope on your account.

## Why we have both

The Cloudflare docs MCP is free of charge and free of risk. Bindings MCP
needs your real account access — useful for ops, but treat it like any
other production credential: only run it from machines you trust, and
review the agent's intended tool calls before approving destructive ones
(e.g. bucket deletion).

## Adding more Cloudflare MCP servers later

Cloudflare publishes ~13 remote MCPs. We start with `bindings` + `docs`.
For Phase 2 we may add:
- `radar.mcp.cloudflare.com/sse` (DDoS + traffic intel — useful when
  Drop Radar starts seeing real traffic)
- `logs.mcp.cloudflare.com/sse` (query CF logs from the agent)
- `workers-builds.mcp.cloudflare.com/sse` (deploy Workers — relevant if we
  add an OG image worker or a custom-domain Worker for Pro tier)

Each gets a new entry in `.mcp.json` with the same `mcp-remote` invocation
pattern.

## Reference

- Cloudflare Remote MCP guide: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- mcp-remote npm package: https://www.npmjs.com/package/mcp-remote
- Full list of Cloudflare MCP endpoints: https://github.com/cloudflare/mcp-server-cloudflare#cloudflare-hosted-mcp-servers
