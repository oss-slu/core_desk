#!/usr/bin/env bash
# src/run-integration.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh
docker-compose up -d
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/sluop-test"
echo $DATABASE_URL

echo '🟡 - Waiting for database to be ready...'
$DIR/wait-for-it.sh localhost:5432 -t 45

echo '🟢 - Database is ready!'
sleep 5

npx prisma migrate dev --name init

echo '⚡ Running integration tests...'

# Run vitest with collected arguments
vitest -c ./vitest.config.integration.js $@