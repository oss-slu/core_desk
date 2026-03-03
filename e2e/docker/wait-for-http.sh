#!/usr/bin/env bash
set -euo pipefail

URL="${1:?Usage: wait-for-http.sh <url> [timeout_seconds]}"
TIMEOUT_SECONDS="${2:-180}"
SLEEP_SECONDS="${3:-2}"

echo "Waiting for ${URL}..."
start_time="$(date +%s)"

until curl --silent --show-error --fail "${URL}" >/dev/null; do
  now="$(date +%s)"
  if (( now - start_time >= TIMEOUT_SECONDS )); then
    echo "Timed out waiting for ${URL} after ${TIMEOUT_SECONDS}s."
    exit 1
  fi
  sleep "${SLEEP_SECONDS}"
done

echo "Ready: ${URL}"
