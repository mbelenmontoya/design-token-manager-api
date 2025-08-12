#!/usr/bin/env bash
# Stage-1 API audit runner
# Example CI usage:
#   PRs:     AUDIT_MODE=strict  bash tools/audit/audit_api.sh
#   Nightly: AUDIT_MODE=lenient bash tools/audit/audit_api.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

AUDIT_MODE="${AUDIT_MODE:-strict}"
REPORT="tools/audit/report_api.md"
mkdir -p tools/audit
: > "$REPORT"

log() { echo "$1" | tee -a "$REPORT"; }

# preload env for base URL
if [ -f .env ]; then
  set -a; source .env; set +a
fi
BASE_URL="http://localhost:${PORT:-4000}"

log "# API Audit Report"
log "Generated on $(date)"
log "Base URL: $BASE_URL"
log ""

# Environment validation (CRITICAL)
env_ok=1
if source tools/audit/check_env_api.sh >/tmp/env.log 2>&1; then
  log "✅ Environment variables present"
else
  env_ok=0
  log "❌ Environment validation failed"
  cat /tmp/env.log >> "$REPORT"
fi

# Start server and wait for health
SERVER_PID=""
cleanup() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

health_ok=0
if [ $env_ok -eq 1 ]; then
  npm start >/tmp/server.log 2>&1 &
  SERVER_PID=$!
  for i in {1..60}; do
    if curl -fs "$BASE_URL/" >/dev/null 2>&1; then
      health_ok=1
      break
    fi
    if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  if [ $health_ok -eq 1 ]; then
    log "✅ Server started"
  else
    log "❌ Server failed to start or healthcheck failed"
    tail -n 20 /tmp/server.log >> "$REPORT"
  fi
else
  log "⚠ Server not started due to env failure"
fi

# Smoke tests
if [ $env_ok -eq 1 ] && [ $health_ok -eq 1 ]; then
  set +e
  node tools/audit/api_smoke.mjs | tee /tmp/smoke.log
  smoke_exit=${PIPESTATUS[0]}
  set -e
  cat /tmp/smoke.log >> "$REPORT"
else
  smoke_exit=2
  log ""
  log "| Check | Result |"
  log "| --- | --- |"
  if [ $env_ok -eq 0 ]; then
    log "| Environment | ❌ - invalid or missing |"
  fi
  if [ $env_ok -eq 1 ] && [ $health_ok -eq 0 ]; then
    log "| Server start/health | ❌ - failed to start |"
  fi
  log ""
  log "Passed: 0, Failed: 1, Skipped: 0"
fi

# Exit handling
if [ "$AUDIT_MODE" = "strict" ]; then
  exit "$smoke_exit"
else
  exit 0
fi

