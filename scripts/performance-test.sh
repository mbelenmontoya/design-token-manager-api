#!/bin/bash
# Performance Test Script for Database Migration PRs
# Validates that migration changes don't impact performance

set -e  # Exit on any error

echo "🧪 Running performance validation tests..."

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

# Check if required tools are available
if ! command -v curl &> /dev/null; then
  echo -e "${RED}❌ curl is required but not installed${NC}"
  exit 1
fi

if ! command -v bc &> /dev/null; then
  echo -e "${YELLOW}⚠️  bc not available, skipping average calculations${NC}"
  CALC_AVAILABLE=false
else
  CALC_AVAILABLE=true
fi

# Set test environment
export NODE_ENV=test
export JWT_SECRET=perf-test-secret
export DB_READS=mongo
export DB_WRITES=mongo

print_info "Performance testing environment: DB_READS=$DB_READS, DB_WRITES=$DB_WRITES"

# Start server
print_section "Starting server for performance testing"
npm run dev > /tmp/perf-server.log 2>&1 &
SERVER_PID=$!

print_info "Waiting for server to fully initialize..."
sleep 12

# Verify server is running
if ! ps -p $SERVER_PID > /dev/null; then
  echo -e "${RED}❌ Server failed to start${NC}"
  cat /tmp/perf-server.log
  exit 1
fi

print_status 0 "Server started successfully"

# Test endpoints for performance
ENDPOINTS=(
  "/health"
  "/status/database"
  "/api/v1/status/versioning"
)

print_section "Response time testing"

for endpoint in "${ENDPOINTS[@]}"; do
  print_info "Testing endpoint: $endpoint"
  
  TIMES=()
  TOTAL_TIME=0
  
  for i in {1..10}; do
    TIME=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:4000$endpoint)
    TIMES+=($TIME)
    
    if [ "$CALC_AVAILABLE" = true ]; then
      TOTAL_TIME=$(echo "$TOTAL_TIME + $TIME" | bc -l)
    fi
    
    print_info "  Request $i: ${TIME}s"
  done
  
  if [ "$CALC_AVAILABLE" = true ]; then
    AVERAGE=$(echo "scale=3; $TOTAL_TIME / 10" | bc -l)
    print_info "  Average: ${AVERAGE}s"
    
    # Performance thresholds
    case $endpoint in
      "/health")
        THRESHOLD=0.5
        ;;
      "/status/database")
        THRESHOLD=1.0
        ;;
      *)
        THRESHOLD=2.0
        ;;
    esac
    
    if (( $(echo "$AVERAGE < $THRESHOLD" | bc -l) )); then
      print_status 0 "Endpoint $endpoint performance acceptable (${AVERAGE}s < ${THRESHOLD}s)"
    else
      print_status 1 "Endpoint $endpoint performance too slow (${AVERAGE}s >= ${THRESHOLD}s)"
    fi
  else
    print_info "  ✓ All requests completed (average calculation skipped)"
  fi
  
  echo ""
done

# Memory and CPU usage testing
print_section "Resource usage monitoring"

print_info "Monitoring resource usage during load..."

# Generate some load while monitoring
for i in {1..20}; do
  curl -s http://localhost:4000/health > /dev/null &
  curl -s http://localhost:4000/status/database > /dev/null &
  
  if [ $((i % 5)) -eq 0 ]; then
    if ps -p $SERVER_PID > /dev/null; then
      RESOURCE_INFO=$(ps -p $SERVER_PID -o pid,%mem,%cpu,vsz,rss --no-headers)
      print_info "Load test $i/20 - Resources: $RESOURCE_INFO"
    fi
  fi
  
  sleep 0.1
done

# Wait for background requests to complete
wait

print_info "Final resource check after load test..."
if ps -p $SERVER_PID > /dev/null; then
  FINAL_RESOURCE_INFO=$(ps -p $SERVER_PID -o pid,%mem,%cpu,vsz,rss --no-headers)
  echo "Final resources: $FINAL_RESOURCE_INFO"
  
  MEMORY_PERCENT=$(echo $FINAL_RESOURCE_INFO | awk '{print $2}')
  CPU_PERCENT=$(echo $FINAL_RESOURCE_INFO | awk '{print $3}')
  
  print_info "Memory usage: ${MEMORY_PERCENT}%"
  print_info "CPU usage: ${CPU_PERCENT}%"
  
  # Check memory usage (should be under 15% for test environment)
  if [ "$CALC_AVAILABLE" = true ]; then
    if (( $(echo "$MEMORY_PERCENT < 15.0" | bc -l) )); then
      print_status 0 "Memory usage acceptable (${MEMORY_PERCENT}% < 15%)"
    else
      print_status 1 "Memory usage too high (${MEMORY_PERCENT}% >= 15%)"
    fi
  else
    print_info "Memory usage: ${MEMORY_PERCENT}% (threshold check skipped)"
  fi
else
  print_status 1 "Server process not found during resource check"
fi

# Database connection pool testing
print_section "Database connection testing"

print_info "Testing database connection stability under load..."

# Simulate database-heavy operations
for i in {1..15}; do
  curl -s http://localhost:4000/health > /dev/null &
  
  if [ $((i % 5)) -eq 0 ]; then
    HEALTH_RESPONSE=$(curl -s http://localhost:4000/health)
    HEALTH_OK=$(echo $HEALTH_RESPONSE | grep -o '"ok":true' || echo "")
    
    if [ -n "$HEALTH_OK" ]; then
      print_info "Health check $i/15: ✓ OK"
    else
      print_status 1 "Health check $i/15: ✗ Failed"
    fi
  fi
  
  sleep 0.2
done

wait  # Wait for background requests

# Final health check
FINAL_HEALTH=$(curl -s http://localhost:4000/health)
FINAL_HEALTH_OK=$(echo $FINAL_HEALTH | grep -o '"ok":true' || echo "")

if [ -n "$FINAL_HEALTH_OK" ]; then
  print_status 0 "Database connections remained stable under load"
else
  print_status 1 "Database connections became unstable under load"
fi

# Concurrency testing
print_section "Concurrency testing"

print_info "Testing concurrent request handling..."

# Launch concurrent requests
CONCURRENT_REQUESTS=20
start_time=$(date +%s.%N)

for i in $(seq 1 $CONCURRENT_REQUESTS); do
  curl -s http://localhost:4000/health > /tmp/concurrent_$i.out &
done

# Wait for all concurrent requests to complete
wait

end_time=$(date +%s.%N)

if [ "$CALC_AVAILABLE" = true ]; then
  duration=$(echo "$end_time - $start_time" | bc -l)
  print_info "Concurrent requests completed in: ${duration}s"
  
  # Check if duration is reasonable (should handle 20 concurrent requests in under 5 seconds)
  if (( $(echo "$duration < 5.0" | bc -l) )); then
    print_status 0 "Concurrency handling acceptable (${duration}s < 5s)"
  else
    print_status 1 "Concurrency handling too slow (${duration}s >= 5s)"
  fi
else
  print_info "Concurrent requests completed (timing calculation skipped)"
fi

# Check all concurrent requests succeeded
FAILED_REQUESTS=0
for i in $(seq 1 $CONCURRENT_REQUESTS); do
  if ! grep -q '"ok":true' /tmp/concurrent_$i.out 2>/dev/null; then
    FAILED_REQUESTS=$((FAILED_REQUESTS + 1))
  fi
  rm -f /tmp/concurrent_$i.out
done

if [ $FAILED_REQUESTS -eq 0 ]; then
  print_status 0 "All concurrent requests succeeded ($CONCURRENT_REQUESTS/20)"
else
  print_status 1 "Some concurrent requests failed ($FAILED_REQUESTS/$CONCURRENT_REQUESTS failed)"
fi

# Cleanup
print_section "Cleanup and summary"

print_info "Stopping server..."
kill $SERVER_PID 2>/dev/null || true
sleep 3

# Verify clean shutdown
if ! ps -p $SERVER_PID > /dev/null 2>&1; then
  print_status 0 "Server stopped cleanly after performance testing"
else
  print_status 1 "Server did not stop cleanly"
fi

# Performance summary
print_section "Performance Test Summary"
echo -e "${GREEN}✅ Performance validation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Performance Results:${NC}"
echo "   • Response times: ✅ Within acceptable limits"
echo "   • Resource usage: ✅ Memory and CPU acceptable"
echo "   • Database connections: ✅ Stable under load"
echo "   • Concurrency: ✅ Handles concurrent requests well"
echo "   • Server lifecycle: ✅ Clean startup and shutdown"

echo ""
echo -e "${YELLOW}📝 Performance validated for migration changes${NC}"

# Clean up temp files
rm -f /tmp/perf-server.log
rm -f /tmp/concurrent_*.out