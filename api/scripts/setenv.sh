#!/usr/bin/env bash
# scripts/setenv.sh

# Export env vars if .env file exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found. Skipping environment variable export."
fi