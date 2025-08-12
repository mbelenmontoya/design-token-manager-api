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
if [ $env_ok -eq 0 ] && [ "$AUDIT_MODE" = "strict" ]; then
  exit 1
fi

# Start server and wait for health
SERVER_PID=""
cleanup() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

health_ok=0
if [ $env_ok -eq 1 ]; then
  npm run dev >/tmp/server.log 2>&1 &
  SERVER_PID=$!
  for i in {1..60}; do
    if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
      break
    fi
    res=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" || true)
    body=$(echo "$res" | head -n -1)
    code=$(echo "$res" | tail -n1)
    if [ "$code" = "200" ] && echo "$body" | grep -q '"ok":true'; then
      health_ok=1
      break
    fi
    sleep 1
  done
  if [ $health_ok -eq 1 ]; then
    log "✅ API healthy"
  else
    log "❌ API failed health check"
    tail -n 20 /tmp/server.log >> "$REPORT"
  fi
else
  log "⚠ API not started due to env failure"
fi

if [ $health_ok -eq 0 ] && [ "$AUDIT_MODE" = "strict" ]; then
  exit 2
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

