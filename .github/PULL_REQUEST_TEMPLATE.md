# Database Migration PR Template

## PR Information

**Migration PR Number**: #__ (e.g., PR #1, PR #2, etc.)  
**Migration Phase**: ___ (e.g., "DAL Foundation", "Controller Migration", etc.)

## Overview

### What does this PR do?
<!-- Provide a clear, concise description of the changes -->

### Why is this change needed?
<!-- Explain the business/technical rationale -->

### Migration Context
<!-- Which phase of the MongoDB → PostgreSQL migration is this? -->

## Changes Made

### ✅ Code Changes
- [ ] **Core Implementation**: Describe main functionality added/modified
- [ ] **Configuration**: Environment variables, config files, dependencies
- [ ] **Database Layer**: DAL, adapters, or database schema changes
- [ ] **API Changes**: Controllers, routes, middleware (if any)
- [ ] **Monitoring**: Health checks, logging, status endpoints

### ✅ Testing
- [ ] **Unit Tests**: New components have comprehensive unit tests
- [ ] **Integration Tests**: End-to-end workflow validation
- [ ] **Regression Tests**: Existing functionality remains intact
- [ ] **Performance Tests**: No significant performance degradation
- [ ] **Migration-Specific Tests**: Validate migration phase requirements

### ✅ Documentation
- [ ] **CLAUDE.md**: Updated with new components and patterns
- [ ] **MIGRATION_PLAN.md**: Updated with current progress
- [ ] **ROADMAP.md**: Reflects current state and next steps
- [ ] **API Documentation**: Swagger/OpenAPI updated if needed
- [ ] **README**: Updated if setup process changed

## Database Configuration

### Current Environment Settings
```bash
DB_READS=____
DB_WRITES=____
```

### Expected After This PR
```bash
DB_READS=____
DB_WRITES=____
```

### Migration Safety
- [ ] **No Data Loss Risk**: Changes don't affect existing data
- [ ] **Backward Compatible**: Can rollback without issues
- [ ] **Dual-Write Safe**: If applicable, handles dual-write scenarios correctly
- [ ] **Connection Failover**: Graceful handling of connection issues

## Testing Results

### ✅ Automated Tests
- [ ] **All existing tests pass**: `npm test`
- [ ] **New tests pass**: `npm test -- tests/path/to/new/tests`
- [ ] **Integration tests pass**: `npm run test:endpoints` (CI only)
- [ ] **DAL tests pass**: `npm test -- tests/dal/`

### ✅ Manual Testing
- [ ] **Health endpoints work**: `/health` and `/status/database`
- [ ] **Key API workflows tested**: List the main workflows you tested
- [ ] **Multi-tenant isolation**: Verified tenant data separation
- [ ] **Authentication flows**: JWT and API key auth work correctly

### ✅ Performance Validation
- [ ] **Response times maintained**: No significant latency increase
- [ ] **Memory usage stable**: No memory leaks detected
- [ ] **Database connections**: Connection pooling working correctly

## API Compatibility

### ✅ Breaking Changes Assessment
- [ ] **No Breaking Changes**: All existing API contracts maintained
- [ ] **Response Format**: JSON responses unchanged
- [ ] **Status Codes**: HTTP status codes unchanged
- [ ] **Authentication**: Existing auth mechanisms work identically
- [ ] **Rate Limiting**: Existing limits and behaviors preserved

### ✅ Enhancement Summary
<!-- List any new endpoints, improved responses, or additional functionality -->

## Local Testing Instructions

### Prerequisites Check
- [ ] MongoDB connection working
- [ ] Environment variables set correctly
- [ ] Dependencies installed (`npm install`)

### Testing Steps
1. **Run full test suite**: 
   ```bash
   npm test
   ```

2. **Test health endpoints**:
   ```bash
   # Start server
   npm run dev
   
   # In another terminal:
   curl http://localhost:4000/health
   curl http://localhost:4000/status/database
   ```

3. **Test key workflows**:
   <!-- Provide specific API calls to test -->
   ```bash
   # Example workflow testing
   # Add specific curl commands or testing steps
   ```

### Expected Results
<!-- What should testers see when everything works correctly -->

## Deployment Readiness

### ✅ Production Considerations
- [ ] **Environment Variables**: All required env vars documented
- [ ] **Database Migrations**: Any schema changes documented
- [ ] **Rollback Plan**: Clear rollback instructions provided
- [ ] **Health Checks**: Updated health checks work correctly
- [ ] **Resource Requirements**: No significant increase in resource usage

### ✅ Monitoring & Alerts
- [ ] **Health Endpoints**: Return appropriate status codes
- [ ] **Error Handling**: Graceful error handling and logging
- [ ] **Migration Status**: Clear visibility into migration phase
- [ ] **Performance Metrics**: Existing metrics still collected

## Rollback Instructions

### If Issues Occur
<!-- Provide step-by-step rollback instructions -->

### Data Safety
- [ ] **No Data Loss**: Rollback doesn't lose data
- [ ] **State Consistency**: System remains in consistent state
- [ ] **Quick Recovery**: Rollback can be completed quickly

## Security Review

### ✅ Security Considerations
- [ ] **No Credential Exposure**: No hardcoded secrets or credentials
- [ ] **Input Validation**: All inputs properly validated
- [ ] **SQL Injection**: If applicable, parameterized queries used
- [ ] **Access Control**: Existing authorization mechanisms preserved
- [ ] **Audit Trail**: Changes properly logged

## Migration-Specific Checklist

### For DAL/Database PRs
- [ ] **Adapter Interface**: Implements complete DatabaseAdapter interface
- [ ] **Error Handling**: Comprehensive error handling and recovery
- [ ] **Connection Management**: Proper connection lifecycle management
- [ ] **Transaction Support**: If needed, transactions handled correctly

### For Controller Migration PRs
- [ ] **DAL Integration**: Controllers use DatabaseService instead of direct models
- [ ] **Response Format**: Identical JSON responses as before
- [ ] **Error Responses**: Error handling and status codes unchanged
- [ ] **Middleware Compatibility**: Works with existing middleware

### For Dual-Write PRs
- [ ] **Consistency**: Both databases receive identical data
- [ ] **Failure Handling**: Partial failures handled gracefully
- [ ] **Performance**: Dual writes don't cause significant slowdown
- [ ] **Comparison Tools**: Can validate data consistency between databases

## Review Checklist

### ✅ Code Quality
- [ ] **Code Style**: Follows existing conventions and style
- [ ] **Documentation**: Code is well-documented with JSDoc comments
- [ ] **Error Handling**: Comprehensive error handling
- [ ] **Performance**: No obvious performance issues

### ✅ Testing Quality
- [ ] **Test Coverage**: Good coverage of new functionality
- [ ] **Test Quality**: Tests are meaningful and thorough
- [ ] **Edge Cases**: Important edge cases covered
- [ ] **Integration**: Tests validate real-world workflows

### ✅ Documentation Quality
- [ ] **Accuracy**: Documentation matches implementation
- [ ] **Completeness**: All new features documented
- [ ] **Clarity**: Clear and easy to understand
- [ ] **Examples**: Practical usage examples provided

---

## Additional Notes

<!-- Any additional context, concerns, or information for reviewers -->

## Migration Progress Tracking

**Previous Phase**: ________________  
**Current Phase**: ________________  
**Next Phase**: ________________  
**Overall Progress**: ___% complete

---

**Ready for Review**: [ ] Yes / [ ] No

**Reviewer Instructions**: 
1. Verify all checkboxes are completed
2. Run local testing steps
3. Review code changes for quality and safety
4. Confirm migration strategy alignment
5. Check documentation accuracy