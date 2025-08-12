#!/usr/bin/env bash
# Minimal env validator for API audit

set -e

# Load .env if present
if [ -f .env ]; then
  set -a; source .env; set +a
fi

missing=()
[ -z "${MONGO_URI:-}" ] && missing+=("MONGO_URI")
[ -z "${JWT_SECRET:-}" ] && missing+=("JWT_SECRET")

export PORT="${PORT:-4000}"
export CLIENT_URL="${CLIENT_URL:-http://localhost:5173}"

if [ ${#missing[@]} -ne 0 ]; then
  echo "Missing required env vars: ${missing[*]}" >&2
  return 1
fi

# Optional Stripe vars – skip billing checks if absent
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  export SMOKE_STRIPE=skip
fi

return 0

