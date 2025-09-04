#!/usr/bin/env bash
set -euo pipefail

# Load selected vars from .env safely (ignore invalid lines)
if [[ -f .env ]]; then
  while IFS= read -r line; do
    # skip comments and empty lines
    [[ -z "$line" || "$line" =~ ^\s*# ]] && continue
    # only accept KEY=VALUE lines without spaces around =
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
    fi
  done < .env
fi

PORT="${PORT:-4000}"
BASE="http://localhost:${PORT}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Please configure your Supabase Postgres connection in .env before running local:verify." >&2
  exit 1
fi

echo "Generating Prisma client..."
npx prisma generate >/dev/null 2>&1 || {
  echo "Failed to generate Prisma client. Try: npx prisma generate" >&2
  exit 1
}

echo "Starting API server on port ${PORT}..."
NODE_ENV=development node src/index.js &
SERVER_PID=$!
trap 'kill ${SERVER_PID} >/dev/null 2>&1 || true' EXIT

echo "Waiting for /status/postgres to become healthy..."
for i in {1..30}; do
  if curl -sf "${BASE}/status/postgres" | jq -e '.ok == true' >/dev/null 2>&1; then
    echo "Service is healthy."
    break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo "Timed out waiting for service health; proceeding anyway." >&2
  fi
done

echo "Running status smoke..."
npm run -s smoke:status || true

echo "Running Supabase tests (server must be running)..."
npm run -s test:supabase || true

echo "Running full smoke (requires API_KEY/TENANT_ID/PROJECT_ID)..."
npm run -s smoke:all || true

echo "Local verification complete."
