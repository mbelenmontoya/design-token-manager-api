#!/usr/bin/env bash
# Validate required environment variables for the API.

set -u

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found" >&2
  exit 1
fi

# Load variables
set -a
source "$ENV_FILE"
set +a

missing=()
for var in PORT MONGO_URI JWT_SECRET CLIENT_URL; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "Missing required env vars: ${missing[*]}" >&2
  echo "Provide them in $ENV_FILE" >&2
  exit 1
fi

stripe_missing=()
for var in STRIPE_SECRET STRIPE_PRICE_BASIC STRIPE_PRICE_PRO; do
  if [ -z "${!var:-}" ]; then
    stripe_missing+=("$var")
  fi
done

if [ ${#stripe_missing[@]} -ne 0 ]; then
  echo "Missing optional Stripe env vars: ${stripe_missing[*]} (billing checks will be skipped)" >&2
  export SMOKE_STRIPE=skip
fi

exit 0

