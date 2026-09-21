# Boot telemetry serverless function

Deploy to Vercel: `vercel deploy` from the repo root (this file lives in `server/telemetry/`).

1. Create a Vercel KV (Upstash Redis) store in the Vercel dashboard.
2. Bind it to the project — sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. The OS POSTs to `/api/telemetry/increment` on every boot.

If unconfigured, the client falls back to a localStorage counter — the About panel
still shows a number.
