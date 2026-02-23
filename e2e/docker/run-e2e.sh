#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${E2E_DIR}/.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env.e2e"
APP_BASE_URL="${BASE_URL:-http://localhost:3030}"
WAIT_TIMEOUT_SECONDS="${E2E_WAIT_SECONDS:-180}"

load_env_defaults() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 0
  fi

  while IFS= read -r line || [[ -n "${line}" ]]; do
    [[ -z "${line}" || "${line}" == \#* ]] && continue
    if [[ "${line}" != *"="* ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"

    if [[ -z "${!key+x}" ]]; then
      export "${key}=${value}"
    fi
  done < "${ENV_FILE}"
}

read_env_value() {
  local key="$1"
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 1
  fi

  local line
  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"

  if [[ -z "${line}" ]]; then
    return 1
  fi

  printf "%s" "${line#*=}"
}

to_host_database_url() {
  local db_url="${1:-}"
  db_url="${db_url//@postgres:/@127.0.0.1:}"
  db_url="${db_url//@db:/@127.0.0.1:}"
  printf "%s" "${db_url}"
}

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
  local host_database_url="${E2E_DATABASE_URL:-}"
  if [[ -z "${host_database_url}" ]]; then
    host_database_url="$(read_env_value DATABASE_URL || true)"
  fi
  if [[ -z "${host_database_url}" ]]; then
    host_database_url="${DATABASE_URL:-}"
  fi
  host_database_url="$(to_host_database_url "${host_database_url}")"

  (
    cd "${ROOT_DIR}"
    npm --workspace api exec prisma generate
  )

  (
    cd "${E2E_DIR}"
    BASE_URL="${APP_BASE_URL}" \
    DATABASE_URL="${host_database_url}" \
    JWT_SECRET="${JWT_SECRET:-}" \
    npx cypress "${runner}"
  )
}

load_env_defaults

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
