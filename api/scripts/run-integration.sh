#!/usr/bin/env bash
# src/run-integration.sh

DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "${CI:-}" != "true" ]; then
  source "$DIR/setenv.sh"
  docker-compose up -d

  echo '🟡 - Waiting for database to be ready...'
  sleep 5

  echo '🛠️ - Ensuring database exists...'
  docker exec api-db-1 psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'sluop-test';" | grep -q 1 || \
    docker exec api-db-1 psql -U postgres -c "CREATE DATABASE \"sluop-test\";"
fi

export DATABASE_URL="postgres://postgres:postgres@localhost:5432/sluop-test"

echo '🟢 - Database is ready!'

npx prisma migrate deploy --config prisma.config.ts
npx prisma generate

echo '⚡ Running integration tests...'

# Run vitest with collected arguments
vitest -c ./vitest.config.integration.js $@
