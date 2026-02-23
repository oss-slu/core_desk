#!/usr/bin/env bash
set -euo pipefail

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
WAIT_SECONDS="${POSTGRES_WAIT_SECONDS:-90}"

echo "Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
start_time="$(date +%s)"
until nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  now="$(date +%s)"
  if (( now - start_time >= WAIT_SECONDS )); then
    echo "Timed out waiting for Postgres."
    exit 1
  fi
  sleep 1
done

echo "Postgres is reachable. Applying Prisma migrations..."
cd /api
npx prisma migrate deploy

echo "Starting API..."
exec "$@"
