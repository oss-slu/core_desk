# Cloudflare STL renderer worker

This worker runs on Cloudflare Workers with Browser Rendering enabled. It takes a batch of STL render tasks, spins up a browser session via `@cloudflare/puppeteer`, renders as many as possible inside a single request window (30–60s), and returns PNGs plus basic bounding box stats.

## Expected environment

- Bind a Browser Rendering instance in `wrangler.toml`:
  ```toml
  name = "stl-renderer"
  main = "stl-renderer.js"
  compatibility_date = "2024-11-23"

  [vars]
  # optional: restrict inbound bearer token
  RENDER_TOKEN = "<shared-secret>"

  [browser]
  binding = "BROWSER"
  ```
- Install deps for the worker bundle: `npm install @cloudflare/puppeteer`.

## Request/response contract

- **POST** body:
  ```json
  {
    "tasks": [{ "id": "task-id", "fileUrl": "https://...", "fileName": "part.stl" }],
    "deadlineMs": 30000
  }
  ```
- **Response**:
  ```json
  {
    "results": [
      { "taskId": "task-id", "ok": true, "pngBase64": "...", "stats": { "boundingBox": [x,y,z] } }
    ]
  }
  ```
- The bearer token (if set) should be validated at the edge before processing.

## Notes

- The worker reuses a single browser for the entire batch to stay under Cloudflare limits (3 concurrent browsers, 60s lifetime, 3 new per minute).
- Rendering uses `three` + `STLLoader` from a CDN; tweak materials/camera in `stl-renderer.js` as desired.
