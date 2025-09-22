#!/bin/sh
set -e

echo "[entrypoint] Starting API entrypoint for e2e..."

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

# Wait for Postgres to be ready
echo "[entrypoint] Waiting for database... ($DATABASE_URL)"

# Parse host and port from DATABASE_URL robustly (handles credentials)
# Examples accepted:
# - postgresql://user:pass@db:5432/sluop
# - postgres://db/sluop
# - postgresql://db:5432/sluop
URL_NO_SCHEME="${DATABASE_URL#*://}"
# Strip credentials if present
URL_NO_CREDS="${URL_NO_SCHEME#*@}"
# Host is everything up to first ':' or '/'
DB_HOST="${URL_NO_CREDS%%[:/]*}"
# Remainder after host
REST="${URL_NO_CREDS#${DB_HOST}}"
DB_PORT=5432
case "$REST" in
  :*)
    # Starts with :PORT/...
    REST_NO_COLON="${REST#:}"
    DB_PORT="${REST_NO_COLON%%/*}"
    ;;
  *)
    # No explicit port
    ;;
esac

echo "[entrypoint] Parsed DB host=$DB_HOST port=$DB_PORT"

# First ensure DNS can resolve the DB host inside the compose network
RESOLVE_RETRIES=60
until getent ahosts "$DB_HOST" >/dev/null 2>&1 || [ $RESOLVE_RETRIES -eq 0 ]; do
  echo "[entrypoint] DNS not ready for $DB_HOST..."
  RESOLVE_RETRIES=$((RESOLVE_RETRIES-1))
  sleep 1
done

if [ $RESOLVE_RETRIES -eq 0 ]; then
  echo "[entrypoint] ERROR: Timed out resolving DB host '$DB_HOST'" >&2
  exit 1
fi

# Then wait for the DB port to accept connections
RETRIES=60
until nc -z "$DB_HOST" "$DB_PORT" || [ $RETRIES -eq 0 ]; do
  echo "[entrypoint] DB not ready yet..."
  RETRIES=$((RETRIES-1))
  sleep 1
done

if [ $RETRIES -eq 0 ]; then
  echo "[entrypoint] ERROR: Timed out waiting for DB" >&2
  exit 1
fi

# Apply Prisma migrations
echo "[entrypoint] Running prisma migrate deploy..."
cd /api
npx prisma migrate deploy

echo "[entrypoint] Launching API: $@"
exec "$@"
