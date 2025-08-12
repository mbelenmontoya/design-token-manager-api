#!/usr/bin/env bash
# Stage-1 API audit runner
# Example CI usage:
#   PRs:     AUDIT_MODE=strict  bash tools/audit/audit_api.sh
#   Nightly: AUDIT_MODE=lenient bash tools/audit/audit_api.sh

set -uo pipefail

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

critical_failed=0
pre_total=0
pre_fail=0

finalize_and_exit() {
  log ""
  log "## Preliminary Summary"
  log "Passed: $((pre_total-pre_fail))/$pre_total"
  log ""
  log "Audit complete (mode: $AUDIT_MODE)"
  exit "$1"
}

fail_critical() {
  critical_failed=1
  pre_fail=$((pre_fail+1))
  if [ "$AUDIT_MODE" = "strict" ]; then
    finalize_and_exit 2
  fi
}

# 1. Merge conflict markers (CRITICAL)
pre_total=$((pre_total+1))
if command -v rg >/dev/null 2>&1; then
  conflicts=$(rg -n "(<<<<<<<|=======|>>>>>>>)" --hidden --no-ignore -g "!node_modules" || true)
else
  conflicts=$(grep -R -n -E "(<<<<<<<|=======|>>>>>>>)" --exclude-dir='.git' --exclude-dir='node_modules' . || true)
fi
if [ -n "$conflicts" ]; then
  log "❌ Merge conflict markers detected"
  log '```'
  log "$conflicts"
  log '```'
  fail_critical
else
  log "✅ No merge conflict markers"
fi

# 2. Environment validation (CRITICAL)
pre_total=$((pre_total+1))
if source tools/audit/check_env_api.sh >/tmp/env.log 2>&1; then
  log "✅ Environment variables present"
else
  cat /tmp/env.log >> "$REPORT"
  log "❌ Environment validation failed"
  fail_critical
fi

# 3. Install dependencies (CRITICAL)
pre_total=$((pre_total+1))
npm install >/tmp/install.log 2>&1
if [ $? -eq 0 ]; then
  log "✅ Dependencies installed"
else
  cat /tmp/install.log >> "$REPORT"
  log "❌ Dependency installation failed"
  fail_critical
fi

# 4. Lint (CRITICAL)
pre_total=$((pre_total+1))
npm run lint >/tmp/lint.log 2>&1
if [ $? -eq 0 ]; then
  log "✅ Lint passed"
else
  cat /tmp/lint.log >> "$REPORT"
  log "❌ Lint failed"
  fail_critical
fi

# 5. Unit tests (CRITICAL)
pre_total=$((pre_total+1))
npm test >/tmp/test.log 2>&1
if [ $? -eq 0 ]; then
  log "✅ Tests passed"
else
  cat /tmp/test.log >> "$REPORT"
  log "❌ Tests failed"
  fail_critical
fi

# Start server
SERVER_PID=""
start_server() {
  npm start >/tmp/server.log 2>&1 &
  SERVER_PID=$!
}

cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID"
  fi
}
trap cleanup EXIT

pre_total=$((pre_total+1))
start_server

# Wait for health up to 60s
health_ok=0
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
if [ "$health_ok" -eq 1 ]; then
  log "✅ Server started"
else
  log "❌ Server failed to start or healthcheck failed"
  tail -n 20 /tmp/server.log >> "$REPORT"
  fail_critical
fi

# Smoke tests
node tools/audit/api_smoke.mjs | tee /tmp/smoke.log
smoke_exit=${PIPESTATUS[0]}
cat /tmp/smoke.log >> "$REPORT"

# Finalize
if [ "$AUDIT_MODE" = "strict" ]; then
  if [ $critical_failed -eq 1 ]; then
    finalize_and_exit 2
  else
    finalize_and_exit "$smoke_exit"
  fi
else
  finalize_and_exit 0
fi

