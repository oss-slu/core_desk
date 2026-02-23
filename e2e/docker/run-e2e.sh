#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
APP_BASE_URL="${BASE_URL:-http://localhost:3030}"
WAIT_TIMEOUT_SECONDS="${E2E_WAIT_SECONDS:-180}"

compose() {
  docker compose -f "${COMPOSE_FILE}" "$@"
}

start_stack() {
  compose up -d --build
  bash "${SCRIPT_DIR}/wait-for-http.sh" "${APP_BASE_URL}/health" "${WAIT_TIMEOUT_SECONDS}"
}

stop_stack() {
  compose down -v --remove-orphans
}

run_cypress() {
  local runner="$1"
  (
    cd "${E2E_DIR}"
    BASE_URL="${APP_BASE_URL}" npx cypress "${runner}"
  )
}

case "${MODE}" in
run)
  trap stop_stack EXIT
  start_stack
  run_cypress run
  ;;
interactive)
  trap stop_stack EXIT
  start_stack
  run_cypress open
  ;;
watch)
  trap stop_stack EXIT
  start_stack
  run_cypress open
  ;;
down)
  stop_stack
  ;;
*)
  echo "Unknown mode: ${MODE}"
  echo "Usage: run-e2e.sh [run|interactive|watch|down]"
  exit 1
  ;;
esac
