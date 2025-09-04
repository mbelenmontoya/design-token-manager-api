# Safety Checklist - Database Migration PR Guide

This document provides a comprehensive safety checklist for creating, reviewing, and merging database migration PRs.

## 🚨 Before You Start

### Environment Safety
- [ ] **Working on a feature branch**: Never work directly on `main`
- [ ] **Using test databases**: No production data at risk
- [ ] **Backup available**: If using real data, backup exists
- [ ] **Rollback plan ready**: Know how to undo changes quickly

## 🔧 PR Creation Safety Checklist

### 1. Code Quality & Testing
- [ ] **All tests pass locally**: `npm test`
- [ ] **DAL tests pass**: `npm run test:dal`
- [ ] **Quick validation passes**: `npm run test:quick`
- [ ] **No breaking changes**: API responses identical to before
- [ ] **Error handling robust**: Graceful failure modes implemented

### 2. Documentation & Communication
- [ ] **PR template completed**: All sections filled out accurately
- [ ] **Migration context clear**: Which phase of migration this represents
- [ ] **Breaking changes documented**: Any API changes clearly noted
- [ ] **Rollback instructions provided**: Step-by-step reversal process
- [ ] **Performance impact assessed**: No significant regression

### 3. Configuration & Environment
- [ ] **Environment variables documented**: All required vars in .env.example
- [ ] **Database configurations tested**: Different DB_READS/DB_WRITES combinations
- [ ] **Health endpoints updated**: Show current migration status
- [ ] **Monitoring preserved**: Existing health checks still work

### 4. Safety Mechanisms
- [ ] **Backward compatibility maintained**: Old code still works
- [ ] **Graceful degradation**: System works even if new features fail
- [ ] **Connection failover**: Handles database connection issues
- [ ] **Data integrity preserved**: No risk of data corruption or loss

## 🔍 PR Review Safety Checklist

### For Reviewers
- [ ] **Run tests locally**: Verify tests pass in reviewer's environment
- [ ] **Test health endpoints**: `/status/postgres` and `/status/database` work correctly
- [ ] **Review migration strategy**: Changes align with overall migration plan
- [ ] **Check performance**: No obvious performance regressions
- [ ] **Validate rollback**: Rollback instructions are clear and tested

### Code Review Focus Areas
- [ ] **Database operations**: All DB calls go through proper abstraction
- [ ] **Error handling**: Comprehensive error handling at all levels
- [ ] **Resource cleanup**: Connections, transactions properly cleaned up
- [ ] **Security**: No hardcoded credentials or SQL injection risks
- [ ] **Logging**: Appropriate logging for debugging and monitoring

## 🚀 Deployment Safety Checklist

### Pre-Deployment
- [ ] **CI passes**: All GitHub Actions workflows green
- [ ] **Staging tested**: Changes work correctly in staging environment
- [ ] **Performance validated**: No significant performance impact
- [ ] **Monitoring ready**: Health checks and alerts configured
- [ ] **Rollback plan tested**: Rollback procedure verified to work

### During Deployment
- [ ] **Health checks monitored**: Watch `/status/postgres` and `/status/database` during deploy
- [ ] **Error rates monitored**: No increase in application errors
- [ ] **Response times monitored**: No significant latency increase
- [ ] **Database connections stable**: Connection pools remain healthy

### Post-Deployment
- [ ] **Full system validation**: Key workflows tested end-to-end
- [ ] **Migration status confirmed**: `/status/database` shows correct phase
- [ ] **Monitoring dashboards updated**: Reflect new migration status
- [ ] **Documentation updated**: Migration progress documented

## 🛡️ Emergency Procedures

### If Something Goes Wrong
1. **Immediate Actions**:
   - Check health endpoints: `curl localhost:4000/status/postgres` and `/status/database`
   - Check application logs for errors
   - Verify database connections are stable

2. **Assessment**:
   - Is it a complete failure or partial degradation?
   - Are users affected or just monitoring showing issues?
   - Is the issue getting worse or stable?

3. **Response**:
   - **Minor issues**: Fix forward if possible, rollback if not
   - **Major issues**: Immediate rollback following documented procedure
   - **Data integrity concerns**: Stop all writes, assess data consistency

### Rollback Procedure
1. **Stop traffic** to affected endpoints (if possible)
2. **Revert code** to previous working commit
3. **Reset environment variables** to previous state
4. **Restart services** and verify health
5. **Validate system** is working correctly
6. **Post-incident review** to understand what happened

## 📋 Local Testing Safety Steps

### Before Creating PR
```bash
# 1. Quick validation
npm run test:quick

# 2. Full validation (if time permits)
npm run test:comprehensive

# 3. Performance check (for major changes)
npm run test:performance
```

### Testing Different Migration States
```bash
# Historical: MongoDB-only mode (no longer active)
DB_READS=mongo DB_WRITES=mongo npm run test:dal

# Test dual-write mode (when available)
# DB_READS=mongo DB_WRITES=dual npm run test:dal

# Test full migration mode (when available)  
# DB_READS=supabase DB_WRITES=supabase npm run test:dal
```

### Manual Validation
```bash
# Start server
npm run dev

# In another terminal:
# Test health endpoints
curl http://localhost:4000/status/postgres | jq .
curl http://localhost:4000/status/database | jq .

# Test API functionality (with proper auth)
# curl -H "Authorization: Bearer $JWT" http://localhost:4000/api/v1/tokens
```

## 🎯 Migration-Specific Safety Guidelines

### PR #1: DAL Foundation
- ✅ **No controller changes**: Only infrastructure and interfaces
- ✅ **Supabase behavior validated**: Tokens/API keys/memberships work as expected
- ✅ **Health endpoints enhanced**: `/status/*` reflect DAL and Prisma status
- ✅ **Comprehensive testing**: DAL adapters thoroughly tested

### PR #2: Controller Migration  
- ⚠️ **High risk**: Controllers are core to API functionality
- ✅ **Response format preservation**: JSON responses must be identical
- ✅ **Error handling preservation**: Error codes and messages unchanged
- ✅ **Performance validation**: No significant latency increase

### PR #6: Dual-Write System
- ⚠️ **Critical migration point**: Writing to both databases
- ✅ **Data consistency**: Both databases receive identical data
- ✅ **Failure handling**: Partial failures handled gracefully
- ✅ **Performance impact**: Acceptable performance with dual writes

### PR #8: Migration Cutover
- ⚠️ **Highest risk**: Point of no return for migration
- ✅ **Complete validation**: All functionality tested on new system
- ✅ **Performance parity**: New system performs as well as old
- ✅ **Rollback tested**: Can revert to dual-write if needed

## 🔥 Red Flags - Stop and Investigate

### Code Red Flags
- Tests failing that were previously passing
- Significant performance regression (>50% slower)
- Memory leaks or resource exhaustion
- Database connection failures under normal load
- Error rates above baseline

### Process Red Flags
- PR template not fully completed
- Rollback instructions missing or unclear
- No migration context provided
- Breaking changes not documented
- Performance impact not assessed

### System Red Flags
- Health endpoints returning errors
- Database connection pools exhausted
- Significant increase in response times
- Error rate spikes after deployment
- Monitoring systems showing anomalies

## ✅ Success Criteria

### For Each PR
- All automated tests pass
- No performance regression
- Health endpoints show correct status
- Documentation is accurate and complete
- Rollback procedure is clear and tested

### For Overall Migration
- Zero data loss throughout migration
- No service interruption during cutover
- Performance equal or better than before
- Complete removal of old system dependencies
- Comprehensive monitoring and observability

---

## 🚨 Remember: Safety First

**When in doubt, don't deploy.** It's better to take extra time to validate changes than to risk production issues.

**Test everything twice.** The test suite is comprehensive but manual validation catches edge cases.

**Have a rollback plan.** Every change should be easily reversible if issues arise.

**Monitor everything.** Watch health endpoints, error rates, and performance metrics closely.
