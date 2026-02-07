# Cloudflare-based STL rendering

## What changed
- STL thumbnails are no longer rendered inside the API server. Uploads enqueue `StlRenderTask` records and return immediately.
- A background scheduler (`startStlRenderQueue`) spins up to **3** Cloudflare browser sessions at a time, capped at **3 launches/minute**, and each session runs for ~30s to drain as many tasks as it can.
- A reference Cloudflare Worker (`api/cloudflare-worker/stl-renderer.js`) handles the actual browser rendering using `@cloudflare/puppeteer`.

## Environment
- `CLOUDFLARE_RENDER_WORKER_URL` – HTTPS endpoint of the deployed worker.
- `CLOUDFLARE_RENDER_WORKER_TOKEN` – shared bearer token; optional but recommended.
- `STL_RENDER_QUEUE_DISABLED` – set to `true` to skip starting the scheduler (e.g., tests).

## Queue & backoff
- Tasks live in the new `StlRenderTask` table (see `schema.prisma`).
- Locks expire after 30s; stale tasks are recycled automatically.
- Exponential backoff (15s, 30s, 60s, 120s…) up to 4 attempts before marking a task as `FAILED`.

## Deploying the worker
1. Install `@cloudflare/puppeteer` in the worker bundle (now at `microservices/stl-renderer`).
2. Bind `BROWSER` in `wrangler.toml` and set `RENDER_TOKEN` if you want bearer auth (the server will send the token when set).
3. Deploy `microservices/stl-renderer/stl-renderer.js` and point `CLOUDFLARE_RENDER_WORKER_URL` at it.

## Contract
- **Request**: `POST` `{ tasks: [{ id, fileUrl, fileName }], deadlineMs: 30000 }`
- **Response**: `{ results: [{ taskId, ok, pngBase64, stats: { boundingBox: [x,y,z] } | null, error? }] }`

If `CLOUDFLARE_RENDER_WORKER_URL` is unset, the queue falls back to local rendering as a safety net (primarily for dev/test), but production should set the worker URL to stay off the API box.
