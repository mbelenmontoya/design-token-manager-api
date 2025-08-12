#!/usr/bin/env bash
# Validate required environment variables for the API.
# Loads variables from .env if present and ensures mandatory values exist.
set -e

ENV_FILE=".env"

# Load .env if available
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "⚠ .env file not found" >&2
fi

missing=()
for var in MONGO_URI JWT_SECRET CLIENT_URL; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "Missing required env vars: ${missing[*]}" >&2
  exit 1
fi

# Optional Stripe vars
stripe_missing=()
for var in STRIPE_SECRET STRIPE_PRICE_BASIC STRIPE_PRICE_PRO; do
  if [ -z "${!var:-}" ]; then
    stripe_missing+=("$var")
  fi
done

if [ ${#stripe_missing[@]} -ne 0 ]; then
  echo "Missing optional Stripe env vars: ${stripe_missing[*]}" >&2
fi

exit 0
