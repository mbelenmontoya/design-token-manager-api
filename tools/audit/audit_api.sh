#!/usr/bin/env bash
# Comprehensive Stage-1 feature audit script for the Design Token Manager API.
# Runs lint, tests and smoke checks while ensuring environment sanity.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

REPORT="tools/audit/report_api.md"
mkdir -p tools/audit
: > "$REPORT"

log() { echo "$1" | tee -a "$REPORT"; }

log "# API Audit Report"
log "Generated on $(date)"
log ""

# Fail fast on merge conflict markers. Prefer ripgrep but fall back to grep if unavailable.
if command -v rg >/dev/null 2>&1; then
  conflicts=$(rg -l "(<<<<<<<|=======|>>>>>>>)" --hidden --no-ignore -g "!node_modules" || true)
else
  conflicts=$(grep -R -l -E "(<<<<<<<|=======|>>>>>>>)" --exclude-dir='.git' --exclude-dir='node_modules' . || true)
fi

if [ -n "$conflicts" ]; then
  log "❌ Merge conflict markers detected"
  echo "$conflicts" | tee -a "$REPORT"
  exit 1
else
  log "✅ No merge conflict markers"
fi

# Environment validation
if tools/audit/check_env_api.sh >/tmp/env.log 2>&1; then
  log "✅ Environment variables present"
else
  cat /tmp/env.log | tee -a "$REPORT"
  log "❌ Environment validation failed"; exit 1
fi

# Install dependencies
npm install >/tmp/install.log 2>&1
cat /tmp/install.log | tail -n 20 | tee -a "$REPORT"

# Lint and unit tests
npm run lint >/tmp/lint.log 2>&1
cat /tmp/lint.log | tail -n 20 | tee -a "$REPORT"

npm test >/tmp/test.log 2>&1
cat /tmp/test.log | tail -n 20 | tee -a "$REPORT"

# Smoke tests
node tools/audit/api_smoke.mjs | tee /tmp/smoke.log
cat /tmp/smoke.log >> "$REPORT"

log ""
log "Audit complete"
