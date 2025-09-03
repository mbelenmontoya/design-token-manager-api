#!/bin/bash
# Comprehensive Test Script for Database Migration PRs
# Runs full validation of migration changes

set -e  # Exit on any error

echo "🧪 Running comprehensive migration tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_section() {
  echo -e "\n${BLUE}🔍 $1${NC}"
}

# Set test environment
export NODE_ENV=test
export JWT_SECRET=test-secret-comprehensive
export DB_READS=mongo
export DB_WRITES=mongo

print_info "Testing environment: DB_READS=$DB_READS, DB_WRITES=$DB_WRITES"

# 1. Full test suite
print_section "Running full test suite"
print_info "This may take a few minutes..."
npm test
print_status $? "Full test suite completed"

# 2. DAL-specific comprehensive tests
print_section "Running DAL integration validation"
npm test -- tests/dal/DALIntegration.test.js --verbose
print_status $? "DAL integration tests completed"

# 3. Health endpoint validation
print_section "Validating health and monitoring endpoints"
npm test -- tests/dal/HealthEndpoints.test.js --verbose
print_status $? "Health endpoint tests completed"

# 4. Server startup and API validation
print_section "Testing server startup and API functionality"

print_info "Starting server..."
npm run dev > /tmp/comprehensive-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to fully initialize
print_info "Waiting for server initialization..."
sleep 15

# Test multiple endpoints
ENDPOINTS=(
  "/health"
  "/status/database"
  "/api/v1/status/versioning"
  "/"
)

for endpoint in "${ENDPOINTS[@]}"; do
  print_info "Testing endpoint: $endpoint"
  RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000$endpoint)
  
  if [ "$RESPONSE_CODE" -eq 200 ]; then
    print_status 0 "Endpoint $endpoint returned $RESPONSE_CODE"
  else
    echo "❌ Endpoint $endpoint returned $RESPONSE_CODE"
    echo "Server log tail:"
    tail -20 /tmp/comprehensive-server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
done

# 5. DAL configuration validation
print_section "Validating DAL configuration and status"

print_info "Testing health endpoint structure..."
HEALTH_RESPONSE=$(curl -s http://localhost:4000/health)
echo "Health response: $HEALTH_RESPONSE" | jq .

# Validate health response structure
HAS_OK=$(echo $HEALTH_RESPONSE | jq -r '.ok')
HAS_MONGO=$(echo $HEALTH_RESPONSE | jq -r '.mongo')
HAS_DAL=$(echo $HEALTH_RESPONSE | jq -r '.dal')

if [ "$HAS_OK" != "null" ] && [ "$HAS_MONGO" != "null" ] && [ "$HAS_DAL" != "null" ]; then
  print_status 0 "Health endpoint has correct structure"
else
  print_status 1 "Health endpoint missing required fields"
fi

print_info "Testing database status endpoint..."
STATUS_RESPONSE=$(curl -s http://localhost:4000/status/database)
echo "Status response: $STATUS_RESPONSE" | jq .

# Validate status response structure
HAS_INIT=$(echo $STATUS_RESPONSE | jq -r '.initialized')
HAS_CONFIG=$(echo $STATUS_RESPONSE | jq -r '.configuration')
HAS_HEALTH=$(echo $STATUS_RESPONSE | jq -r '.health')
HAS_MIGRATION=$(echo $STATUS_RESPONSE | jq -r '.migration')

if [ "$HAS_INIT" = "true" ] && [ "$HAS_CONFIG" != "null" ] && [ "$HAS_HEALTH" != "null" ] && [ "$HAS_MIGRATION" != "null" ]; then
  print_status 0 "Database status endpoint has correct structure"
else
  print_status 1 "Database status endpoint missing required fields"
fi

# 6. Performance check
print_section "Basic performance validation"

print_info "Testing response times..."
TIMES=()
for i in {1..5}; do
  TIME=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:4000/health)
  TIMES+=($TIME)
  print_info "Request $i: ${TIME}s"
done

# Calculate average (basic bash arithmetic)
TOTAL=$(printf '%s+' "${TIMES[@]}" | sed 's/+$//')
AVERAGE=$(echo "scale=3; ($TOTAL) / ${#TIMES[@]}" | bc -l)
print_info "Average response time: ${AVERAGE}s"

# Check if average is reasonable (under 0.5 seconds for health check)
if (( $(echo "$AVERAGE < 0.5" | bc -l) )); then
  print_status 0 "Response times acceptable (average: ${AVERAGE}s)"
else
  print_status 1 "Response times too slow (average: ${AVERAGE}s)"
fi

# 7. Memory usage check
print_section "Resource usage validation"

print_info "Checking server memory usage..."
if ps -p $SERVER_PID > /dev/null; then
  MEMORY_INFO=$(ps -p $SERVER_PID -o pid,ppid,%mem,%cpu,cmd --no-headers)
  echo "Server process info: $MEMORY_INFO"
  
  MEMORY_PERCENT=$(echo $MEMORY_INFO | awk '{print $3}')
  print_info "Memory usage: ${MEMORY_PERCENT}%"
  
  # Check if memory usage is reasonable (under 10% for test)
  if (( $(echo "$MEMORY_PERCENT < 10.0" | bc -l) )); then
    print_status 0 "Memory usage acceptable"
  else
    print_status 1 "Memory usage too high: ${MEMORY_PERCENT}%"
  fi
else
  print_status 1 "Server process not found"
fi

# Cleanup
print_section "Cleanup and final validation"
print_info "Stopping server..."
kill $SERVER_PID 2>/dev/null || true
sleep 3

# Verify server stopped
if ! ps -p $SERVER_PID > /dev/null 2>&1; then
  print_status 0 "Server stopped cleanly"
else
  print_status 1 "Server did not stop cleanly"
fi

# 8. Configuration matrix test (if this is a migration PR)
if [[ $GITHUB_HEAD_REF == migration/* ]] || [[ $GITHUB_REF == *migration* ]] || [[ $(git branch --show-current) == migration/* ]]; then
  print_section "Migration configuration matrix test"
  
  CONFIGS=(
    "mongo,mongo"
    # Add more as we implement them
    # "mongo,dual"
    # "supabase,dual"  
    # "supabase,supabase"
  )
  
  for config in "${CONFIGS[@]}"; do
    IFS=',' read reads writes <<< "$config"
    print_info "Testing configuration: DB_READS=$reads, DB_WRITES=$writes"
    
    DB_READS=$reads DB_WRITES=$writes npm test -- tests/dal/DatabaseService.test.js --silent
    
    if [ $? -eq 0 ]; then
      print_status 0 "Configuration $reads/$writes works"
    else
      print_status 1 "Configuration $reads/$writes failed"
    fi
  done
fi

# Final summary
print_section "Test Summary"
echo -e "${GREEN}✅ All comprehensive tests passed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo "   • Full test suite: ✅ Passed"
echo "   • DAL integration: ✅ Passed"
echo "   • Health endpoints: ✅ Passed"
echo "   • API functionality: ✅ Passed"
echo "   • Performance: ✅ Acceptable"
echo "   • Resource usage: ✅ Acceptable"
echo "   • Server lifecycle: ✅ Clean"

echo ""
echo -e "${YELLOW}📝 Ready for:${NC}"
echo "   • Code review"
echo "   • PR creation"
echo "   • Deployment to staging"

# Clean up temp files
rm -f /tmp/comprehensive-server.log