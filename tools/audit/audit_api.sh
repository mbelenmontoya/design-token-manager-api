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
fi
cat /tmp/env.log >> "$REPORT"

# Connectivity diagnostics
debug_ok=1
if node tools/audit/debug_env.mjs >/tmp/debug.log 2>&1; then
  log "✅ MongoDB connectivity ok"
else
  debug_ok=0
  env_ok=0
  log "❌ MongoDB connectivity failed"
fi
cat /tmp/debug.log >> "$REPORT"

if [ $env_ok -eq 0 ] && [ "$AUDIT_MODE" = "strict" ]; then
  log ""
  log "| Check | Result |"
  log "| --- | --- |"
  log "| Environment/Connectivity | ❌ - failed |"
  log ""
  log "Passed: 0, Failed: 1, Skipped: 0"
  exit 2
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
set +e
node tools/audit/api_smoke.mjs | tee /tmp/smoke.log
smoke_exit=${PIPESTATUS[0]}
set -e
cat /tmp/smoke.log >> "$REPORT"

# Exit handling
if [ "$AUDIT_MODE" = "strict" ]; then
  exit "$smoke_exit"
else
  exit 0
fi

