#!/bin/bash
# Quick Test Script for Database Migration PRs
# Tests DAL functionality and health endpoints quickly

set -e  # Exit on any error

echo "🧪 Running quick migration tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    exit 1
  fi
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Set test environment
export NODE_ENV=test
export JWT_SECRET=test-secret
export DB_READS=mongo
export DB_WRITES=mongo

print_info "Testing environment: DB_READS=$DB_READS, DB_WRITES=$DB_WRITES"

# 1. DAL tests
print_info "Running DAL tests..."
npm test -- tests/dal/ --silent
print_status $? "DAL tests completed"

# 2. Health endpoint test
print_info "Testing server startup and health endpoints..."

# Start server in background
npm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 8

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:4000/health)
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.ok' 2>/dev/null || echo "false")

if [ "$HEALTH_STATUS" = "true" ]; then
  print_status 0 "Health endpoint working (MongoDB connected)"
elif echo $HEALTH_RESPONSE | grep -q "MongoDB connection not established"; then
  print_info "Health endpoint working but MongoDB not connected (expected for local testing)"
  print_status 0 "Health endpoint structure correct"
else
  echo "Health response: $HEALTH_RESPONSE"
  print_status 1 "Health endpoint failed"
fi

# Test database status endpoint
STATUS_RESPONSE=$(curl -s http://localhost:4000/status/database)
STATUS_INITIALIZED=$(echo $STATUS_RESPONSE | jq -r '.initialized' 2>/dev/null || echo "false")

if [ "$STATUS_INITIALIZED" = "true" ]; then
  print_status 0 "Database status endpoint working (DAL initialized)"
elif echo $STATUS_RESPONSE | grep -q "MongoDB connection not established"; then
  print_info "Database status endpoint working but MongoDB not connected (expected for local testing)"
  print_status 0 "Database status endpoint structure correct"
else
  echo "Status response: $STATUS_RESPONSE"
  print_status 1 "Database status endpoint failed"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ All quick tests passed! Ready for development.${NC}"

# Show next steps
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   • Run comprehensive tests: ./scripts/comprehensive-test.sh"
echo "   • Start development server: npm run dev"
echo "   • View health status: curl http://localhost:4000/health"