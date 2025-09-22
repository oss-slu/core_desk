Dockerized E2E Tests

This directory runs Cypress E2E tests against a Dockerized stack (Postgres + API + Frontend).

What it sets up
- db: Postgres with an isolated data volume per run.
- minio: Local S3-compatible object storage for e2e (ports 9000/9001).
- api: Builds the app UI, serves it via Express, and runs Prisma migrations on startup. Configured to use MinIO for S3 operations.
- cypress: Runs tests with baseUrl=http://api:3030.

Quick start
- Build + run tests (build happens inside the API image, no need to run yarn build locally):
  - npm run test:docker (from this folder or root via npm run test:e2e:docker)
- Tear down stack and remove volumes:
  - npm run down:docker (or root: npm run down:e2e:docker)

Watch mode
- Re-run tests automatically on spec/config changes via Docker:
  - From repo root: `npm run test:e2e:watch`
  - From this folder: `npm run test:docker:watch`
- Re-run tests locally without Docker (requires local Cypress deps):
  - `npm run cy:watch`
- Note: Watch uses legacy polling under Docker to reliably catch changes on bind mounts.

Environment
- API service loads env from e2e/env/api.env and overrides DATABASE_URL in compose.
- If your app build requires Sentry, set SENTRY_AUTH_TOKEN in your shell before running compose:
  - export SENTRY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
  Compose will pass it into the build as an ARG.

S3/MinIO
- MinIO runs in the compose stack and is reachable at http://minio:9000 from other services.
- A bucket named `sluop` is created automatically and set to allow anonymous read for simple public URLs.
- The API is pre-configured via env to use:
  - AWS_ACCESS_KEY_ID=minioadmin
  - AWS_SECRET_ACCESS_KEY=minioadmin
  - AWS_REGION=us-east-1
  - AWS_BUCKET=sluop
  - AWS_ENDPOINT=http://minio:9000
  The S3 client is set to use path-style addressing for non-AWS endpoints.

Notes
- The database is created fresh via Prisma migrations on API startup.
- Each run ends with docker compose down -v to wipe containers/volumes for a clean DB next run.
- The API builds and serves the frontend from /app/dist, so Cypress only needs the API URL.
- Test artifacts (videos/screenshots) are written under e2e/cypress/.

Interactive mode (VNC + watch)
- From repo root: `npm run test:e2e:interactive`
- Connect a VNC client to `vnc://127.0.0.1:5900` (password: `oss`).
- The container runs Cypress with `nodemon --legacy-watch`, so tests re-run on spec/config changes automatically. The test browser is headed and visible via VNC.
