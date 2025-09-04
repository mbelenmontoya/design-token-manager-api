# Testing Quick Reference Card

Quick commands for testing database migration changes safely and efficiently.

## 🚀 Essential Commands

### Quick Tests (2-3 minutes)
```bash
# Quick validation - run first
npm run test:quick

# DAL tests only
npm run test:dal

# Basic linting  
npm run lint
```

### Comprehensive Tests (10-15 minutes)
```bash
# Full test suite
npm test

# Comprehensive migration validation
npm run test:comprehensive

# Integration tests (CI environment only)
CI=true npm run test:endpoints
```

### Supabase Smoke Test (1-2 minutes)
```bash
# Run API and verify tokens endpoints (requires envs)
export API_KEY=dtm_ak_...
export TENANT_ID=...
export PROJECT_ID=...
npm run smoke:supabase
```

### Performance Tests (5-10 minutes)
```bash
# Performance validation
npm run test:performance

# Manual response time check
time curl http://localhost:4000/health
```

## 🏥 Health Monitoring

### Check System Health
```bash
# Start server first
npm run dev

# Then in another terminal:
curl -s localhost:4000/status/database | jq .    # DAL + configuration
curl -s localhost:4000/status/postgres | jq .    # Prisma connectivity
```

## 🔧 Database Configuration Testing

This project runs Supabase-only. DB_READS/DB_WRITES are expected to be `supabase`.

### Prisma Operations
```bash
npm run prisma:validate      # Check schema validity
npm run prisma:generate      # Generate client
npx prisma format            # Format schema
```

## 🐛 Debugging Commands

### When Tests Fail
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/dal/MongoAdapter.test.js

# Clear Jest cache if tests behave strangely
npx jest --clearCache

# Run tests in serial (if timing issues)
npm test -- --runInBand
```

### When Server Won't Start
```bash
# Check if port is in use
lsof -ti:4000

# Kill process using port 4000
lsof -ti:4000 | xargs kill -9

# Start with different port
PORT=4001 npm run dev

# Check environment variables
echo "DB_READS=$DB_READS DB_WRITES=$DB_WRITES"
```

### When Database Issues Occur
```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ismaster')"

# Reset test database (if using local MongoDB)
mongo design-token-test --eval "db.dropDatabase()"

# Re-seed test data
node scripts/seedUser.js
node scripts/seedCategories.js
```

## 📊 Performance Quick Checks

### Response Time Testing
```bash
# Single request timing
curl -w "Time: %{time_total}s\n" -s http://localhost:4000/health

# Multiple requests
for i in {1..10}; do
  curl -w "Request $i: %{time_total}s\n" -s -o /dev/null http://localhost:4000/health
done
```

### Resource Monitoring
```bash
# Find server process
pgrep -f "node.*src/index.js"

# Monitor resources (replace PID)
watch "ps -p PID -o pid,%mem,%cpu,cmd"

# Memory usage
ps aux | grep "node.*src/index.js"
```

## 🎯 Migration-Specific Tests

### PR #1: DAL Foundation
```bash
# Essential tests
npm run test:dal
npm run test:quick
curl localhost:4000/status/database | jq .migration
```

### PR #2: Controller Migration
```bash
# Before and after API response comparison
npm run dev &
curl -H "Auth: Bearer $JWT" localhost:4000/api/v1/tokens > before.json
# Deploy changes
curl -H "Auth: Bearer $JWT" localhost:4000/api/v1/tokens > after.json  
diff before.json after.json  # Should be no differences
```

### Future PRs: Dual-Write Testing
```bash
# Test both database states
DB_WRITES=dual npm run test:comprehensive
# Validate data consistency
# Run custom comparison scripts
```

## 🚨 Emergency Commands

### Quick Rollback
```bash
# Revert to last known good commit
git checkout HEAD~1

# Reset environment  
unset DB_READS DB_WRITES

# Restart server
pkill -f "node.*src/index.js"
npm run dev
```

### System Reset
```bash
# Full reset for development
npm install                  # Reinstall dependencies
npm run prisma:generate     # Regenerate Prisma client
rm -rf node_modules/.cache  # Clear caches
npm test                    # Verify everything works
```

## 📋 Pre-PR Checklist Commands

```bash
# Run these before creating a PR
npm run lint                 # ✅ Code quality
npm run test:quick           # ✅ Quick validation  
npm run test:comprehensive   # ✅ Full validation
npm run prisma:validate      # ✅ Schema check
git status                   # ✅ Commit status

# Start server and test manually
npm run dev &
curl localhost:4000/health   # ✅ Health check
curl localhost:4000/status/database | jq .  # ✅ Migration status
```

## 🔍 Useful Debugging Queries

### Check DAL State
```bash
# Quick DAL validation in Node.js
node -e "
import('./src/dal/DatabaseService.js').then(async ({ default: db }) => {
  console.log('Initialized:', db.isInitialized);
  if (!db.isInitialized) await db.initialize();
  const health = await db.healthCheck();
  console.log('Health:', JSON.stringify(health, null, 2));
  process.exit(0);
});
"
```

### Test Database Operations
```bash
# Test CRUD operations
node -e "
import('./src/dal/DatabaseService.js').then(async ({ default: db }) => {
  await db.initialize();
  const user = await db.createUser({username: 'test', password: 'test'});
  console.log('Created user:', user.username);
  const found = await db.findUserById(user._id);
  console.log('Found user:', found.username);
  process.exit(0);
});
"
```

## 🎨 Output Formatting

### Pretty JSON Output
```bash
# Format JSON responses
curl -s localhost:4000/health | jq .
curl -s localhost:4000/status/database | jq '.migration'

# Save formatted output  
curl -s localhost:4000/health | jq . > health.json
```

### Colorized Output
```bash
# If you have grc (generic colorizer) installed
curl localhost:4000/health | grc cat

# Or use bat for syntax highlighting
curl -s localhost:4000/health | bat -l json
```

---

## 🔥 Most Important Commands

**For daily development:**
1. `npm run test:quick` - Fast validation
2. `npm run dev` - Start development server  
3. `npm run health:check` - Check system status

**Before creating PR:**
1. `npm run test:comprehensive` - Full validation
2. `npm run lint` - Code quality check
3. `curl localhost:4000/status/database` - Migration status

**When things break:**
1. `npm test -- --verbose` - Detailed test output
2. `git checkout HEAD~1` - Quick rollback
3. `npm run test:quick` - Verify fix works
