# Local Testing Guide - Database Migration

This guide provides step-by-step instructions for safely testing database migration changes locally without causing chaos.

## 🚨 Safety First

### Before Starting
1. **Backup your data** (if using real MongoDB)
2. **Use test databases** whenever possible
3. **Run in isolated environment** (separate from production)
4. **Have rollback plan ready**

## Prerequisites Setup

### 1. Environment Preparation
```bash
# 1. Ensure you have Node.js 18+
node --version

# 2. Clone/update the repo
git pull origin main

# 3. Install dependencies
npm install

# 4. Copy environment template
cp .env.example .env
```

### 2. Database Setup Options

#### Option A: MongoDB Memory Server (Recommended for Testing)
```bash
# Already configured in tests - no setup needed
# Uses mongodb-memory-server for isolated testing
```

#### Option B: Local MongoDB
```bash
# Install MongoDB locally or use Docker
docker run --name mongo-test -p 27017:27017 -d mongo:7

# Update .env
MONGO_URI=mongodb://localhost:27017/design-token-test
```

#### Option C: MongoDB Atlas (Test Cluster)
```bash
# Create a test cluster on MongoDB Atlas
# Update .env with test cluster URI
MONGO_URI=mongodb+srv://testuser:testpass@test-cluster.mongodb.net/design-token-test
```

### 3. Supabase Setup (For Later PRs)
```bash
# Update .env with your test Supabase credentials
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_ANON_KEY=your-test-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-test-project.supabase.co:5432/postgres
```

## Testing Workflow by PR

### PR #1: DAL Foundation Testing

#### Quick Smoke Test (2 minutes)
```bash
# 1. Run DAL tests
npm test -- tests/dal/
# Expected: All tests pass (40/40)

# 2. Check health endpoints
npm run dev &
sleep 5
curl http://localhost:4000/health
curl http://localhost:4000/status/database
kill %1  # Stop the server
```

#### Comprehensive Test (10 minutes)
```bash
# 1. Full test suite
npm test
# Expected: All existing tests still pass

# 2. DAL integration validation
npm test -- tests/dal/DALIntegration.test.js
# Expected: 7/7 tests pass, validates complete workflows

# 3. Health endpoint validation
npm test -- tests/dal/HealthEndpoints.test.js
# Expected: 3/3 tests pass, health shows DAL status

# 4. Server startup test
npm run dev
# Expected: 
# - "✅ Database Abstraction Layer initialized"
# - Server starts without errors
# - Health endpoint works
```

#### Deep Validation (20 minutes)
```bash
# 1. Test all DAL operations manually
node -e "
import('./src/dal/DatabaseService.js').then(async ({ default: db }) => {
  await db.initialize();
  
  // Test user operations
  const user = await db.createUser({ username: 'testuser', password: 'hashed123' });
  const foundUser = await db.findUserById(user._id);
  console.log('✅ User operations work:', foundUser.username === 'testuser');
  
  // Test tenant operations
  const tenant = await db.createTenant({ name: 'Test Tenant' });
  const foundTenant = await db.findTenantById(tenant._id);
  console.log('✅ Tenant operations work:', foundTenant.name === 'Test Tenant');
  
  // Test project operations
  const project = await db.createProject({ name: 'Test Project', tenant: tenant._id });
  const projects = await db.findProjectsByTenant(tenant._id);
  console.log('✅ Project operations work:', projects.length === 1);
  
  // Test token operations
  const token = await db.createToken({
    tenant: tenant._id,
    project: project._id,
    name: 'test-token',
    value: '#123456',
    category: 'color'
  });
  const tokens = await db.findTokensByProject(project._id);
  console.log('✅ Token operations work:', tokens.length === 1);
  
  console.log('✅ All DAL operations validated successfully!');
  process.exit(0);
});
"
```

### PR #2: Controller Migration Testing

#### Pre-Migration Baseline
```bash
# 1. Record current API responses (save as baseline)
npm run dev &
sleep 5

# Test token endpoints
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:4000/api/v1/tokens > baseline_tokens.json

# Test other endpoints
curl http://localhost:4000/health > baseline_health.json

kill %1
```

#### Post-Migration Validation
```bash
# 1. Test migrated controllers
npm test -- tests/controllers/  # If we add these tests

# 2. Compare API responses (should be identical)
npm run dev &
sleep 5

curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:4000/api/v1/tokens > migrated_tokens.json

# Compare responses
diff baseline_tokens.json migrated_tokens.json
# Expected: No differences

kill %1
```

### Future PRs: Dual-Write Testing

#### Configuration Testing
```bash
# Test different database configurations
for config in "mongo,mongo" "mongo,dual" "supabase,dual" "supabase,supabase"; do
  IFS=',' read reads writes <<< "$config"
  echo "Testing DB_READS=$reads DB_WRITES=$writes"
  
  DB_READS=$reads DB_WRITES=$writes npm test -- tests/dal/DatabaseService.test.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Configuration $reads/$writes works"
  else
    echo "❌ Configuration $reads/$writes failed"
  fi
done
```

## Automated Testing Scripts

### Quick Test Script
```bash
#!/bin/bash
# save as: scripts/quick-test.sh

echo "🧪 Running quick migration tests..."

# 1. DAL tests
echo "Testing DAL..."
npm test -- tests/dal/ --silent
if [ $? -ne 0 ]; then
  echo "❌ DAL tests failed"
  exit 1
fi

# 2. Health check
echo "Testing health endpoints..."
npm run dev &
SERVER_PID=$!
sleep 5

HEALTH=$(curl -s http://localhost:4000/health | jq -r '.ok')
if [ "$HEALTH" != "true" ]; then
  echo "❌ Health check failed"
  kill $SERVER_PID
  exit 1
fi

kill $SERVER_PID

echo "✅ All quick tests passed!"
```

### Comprehensive Test Script
```bash
#!/bin/bash
# save as: scripts/comprehensive-test.sh

echo "🧪 Running comprehensive migration tests..."

# 1. Full test suite
echo "Running full test suite..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Test suite failed"
  exit 1
fi

# 2. Server startup validation
echo "Testing server startup..."
timeout 30s npm run dev &
SERVER_PID=$!
sleep 10

# Test multiple endpoints
ENDPOINTS=("/health" "/status/database" "/api/v1/status/versioning")
for endpoint in "${ENDPOINTS[@]}"; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000$endpoint)
  if [ "$RESPONSE" -ne 200 ]; then
    echo "❌ Endpoint $endpoint returned $RESPONSE"
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
  echo "✅ Endpoint $endpoint works"
done

kill $SERVER_PID 2>/dev/null

echo "✅ All comprehensive tests passed!"
```

### Performance Test Script
```bash
#!/bin/bash
# save as: scripts/performance-test.sh

echo "🧪 Running performance tests..."

# Start server
npm run dev &
SERVER_PID=$!
sleep 10

# Basic performance test using curl
echo "Testing response times..."

for i in {1..10}; do
  TIME=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:4000/health)
  echo "Request $i: ${TIME}s"
done

# Memory usage check
echo "Checking memory usage..."
ps -p $SERVER_PID -o pid,ppid,%mem,%cpu,cmd

kill $SERVER_PID

echo "✅ Performance test completed"
```

## Troubleshooting Guide

### Common Issues & Solutions

#### "MongoDB connection error"
```bash
# Check MongoDB status
systemctl status mongod   # Linux
brew services list | grep mongo   # Mac

# Or use Docker
docker run --name mongo-test -p 27017:27017 -d mongo:7
```

#### "DAL initialization error"
```bash
# Check environment variables
echo $DB_READS $DB_WRITES

# Reset to defaults
export DB_READS=mongo
export DB_WRITES=mongo
```

#### "Prisma client not generated"
```bash
# Regenerate Prisma client
npx prisma generate
```

#### "Tests failing intermittently"
```bash
# Run tests in serial mode
npm test -- --runInBand

# Clear Jest cache
npx jest --clearCache
```

#### "Port already in use"
```bash
# Find and kill process using port 4000
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=4001 npm run dev
```

## Rollback Procedures

### If DAL Changes Cause Issues
```bash
# 1. Revert to previous commit
git checkout HEAD~1

# 2. Remove DAL configuration
unset DB_READS DB_WRITES

# 3. Restart server
npm run dev
```

### If Database Gets Corrupted
```bash
# 1. Stop server
kill %1  # or Ctrl+C

# 2. Reset test database
mongo design-token-test --eval "db.dropDatabase()"

# 3. Re-seed
node scripts/seedUser.js
node scripts/seedCategories.js
```

## Validation Checklist

### Before Creating PR
- [ ] All tests pass locally: `npm test`
- [ ] DAL tests pass: `npm test -- tests/dal/`
- [ ] Server starts without errors: `npm run dev`
- [ ] Health endpoints work: `curl localhost:4000/health`
- [ ] No breaking changes to API responses
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Performance acceptable

### Before Merging PR
- [ ] CI passes on GitHub
- [ ] PR template fully completed
- [ ] Code review approved
- [ ] Migration plan alignment confirmed
- [ ] Rollback procedures tested
- [ ] Documentation reviewed and accurate

---

## Quick Reference Commands

```bash
# Essential test commands
npm test                           # Full test suite
npm test -- tests/dal/            # DAL tests only
npm run test:endpoints             # Integration tests (CI only)

# Development commands
npm run dev                        # Start development server
npm run lint                       # Check code quality

# Health checks
curl localhost:4000/health         # Basic health
curl localhost:4000/status/database # DAL status

# Database operations
npx prisma generate                # Generate Prisma client
npx prisma validate               # Validate schema
node scripts/seedUser.js          # Create admin user
```

**Remember**: When in doubt, run the tests! The comprehensive test suite is designed to catch issues before they reach production.