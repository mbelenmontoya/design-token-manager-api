# Database Migration Plan: MongoDB → PostgreSQL (Supabase)

## ⚠️ Current Status: BLOCKED on MongoDB Credentials

**Active Phase**: PR #1 - DAL Foundation  
**Progress**: Implementation Complete, **BLOCKED** on MongoDB connection  
**Blocker**: Need valid MongoDB credentials in `.env` file (currently has placeholder values)  
**Next Action**: Update `.env` with real credentials → test → create PR #1  
**Branch**: `feature/dal-foundation-pr1` (ready to commit once tested)

📋 **See NEXT_STEPS.md for immediate action items**

---

## Overview

Safe, incremental migration from MongoDB to PostgreSQL using a Database Abstraction Layer (DAL) with dual-write capabilities.

## Migration Philosophy

- **Safety First**: Each step is reversible and testable
- **Incremental Progress**: Small PRs that don't depend on each other
- **Continuous Validation**: Tests for each increment
- **Documentation**: Keep all docs up-to-date with progress

## PR-Based Implementation Strategy

### **PR #1: DAL Foundation & MongoDB Adapter** 🔄 *IN PROGRESS*
**Goal**: Establish DAL architecture with MongoDB adapter

**Scope**:
- ✅ DAL interfaces and factory
- 🔄 MongoDB adapter implementation
- ✅ Configuration setup
- 📝 Basic tests for adapter
- 📝 Update documentation

**Testing**:
- MongoDB adapter connects properly
- All CRUD operations work through DAL
- Existing API behavior unchanged

**Acceptance Criteria**:
- All existing endpoints work identically
- Tests pass
- Health check shows MongoDB connection via DAL

---

### **PR #2: Token Controller Migration**
**Goal**: Migrate token-related endpoints to use DAL

**Scope**:
- Update `tokenController.js` to use DAL
- Keep all existing API contracts
- Add DAL-specific tests
- Update API documentation

**Testing**:
- Token CRUD operations via DAL
- Multi-tenant filtering works
- Performance benchmarks match

**Acceptance Criteria**:
- All token endpoints use DAL
- No breaking changes to API responses
- Tests verify identical behavior

---

### **PR #3: Auth & User Management Migration**
**Goal**: Migrate authentication and user management

**Scope**:
- Update `authController.js`, `membershipController.js`
- Migrate user, tenant, membership operations
- Preserve JWT/API key authentication

**Testing**:
- Login/authentication flows
- Role-based authorization
- User-tenant relationships

---

### **PR #4: API Keys & Invitations Migration**
**Goal**: Migrate API key and invitation systems

**Scope**:
- Update `apiKeyController.js`, `invitationController.js`
- Preserve API key authentication
- Maintain invitation workflows

**Testing**:
- API key generation and validation
- Invitation creation and acceptance
- Authorization scopes

---

### **PR #5: Supabase Adapter Implementation**
Status: Completed early to enable PR #2 cutover

**Delivered**:
- Implemented `SupabaseAdapter` class using Prisma
- Mapped core operations (users, tenants, projects, tokens, memberships, categories, api keys, invitations, releases)
- Health check via Prisma `$queryRaw` (SELECT 1)

---

### **PR #6: Dual-Write System**
**Goal**: Implement safe dual-write capability

**Scope**:
- `DualWriteAdapter` implementation
- Write to both databases simultaneously
- Comparison and validation logic
- Error handling and rollback

**Testing**:
- Dual-write creates identical records
- Handles partial failures gracefully
- Comparison reports any discrepancies

---

### **PR #7: Data Migration Scripts**
**Goal**: Tools for migrating existing data
[... omitted]

---

### **PR #8: Health & Monitoring Updates**
**Goal**: Update observability for dual-database setup

**Scope**:
- Health endpoints include both databases
- Status endpoint shows read/write modes
- Connection monitoring
- Performance metrics

**Testing**:
- Health checks work for both databases
- Status accurately reflects configuration
- Monitoring catches connection issues

---

### **PR #9: Migration Cutover Procedures**
**Goal**: Safe production cutover process

**Scope**:
- Environment variable management
- Cutover validation checklist
- Rollback procedures
- Performance monitoring

**Testing**:
- Cutover process in staging
- Rollback procedures
- Performance under load

---

### **PR #10: Cleanup & Optimization**
**Goal**: Remove MongoDB dependencies post-migration

**Scope**:
- Remove MongoDB adapter and dependencies
- Clean up dual-write code
- Optimize Supabase queries
- Update documentation

**Testing**:
- Full test suite against Supabase only
- Performance optimization validation
- Documentation accuracy

---

## Testing Strategy

### **Per-PR Testing**
- Unit tests for new components
- Integration tests for affected endpoints
- Performance benchmarks
- Manual testing checklist

### **Migration-Specific Tests**
- Data consistency validation
- Performance comparison (before/after)
- Dual-write correctness
- Rollback procedures

### **Long-term Tests to Keep**
- Database connection health checks
- Data integrity validation
- Performance monitoring
- Multi-tenant isolation tests

### **Tests to Deprecate Post-Migration**
- MongoDB-specific tests
- Dual-write validation tests
- Migration comparison scripts
- Legacy adapter tests

---

## Configuration Management

### **Environment Variables by Phase**

**Phase 1-4 (MongoDB Only)**:
```bash
DB_READS=mongo
DB_WRITES=mongo
```

**Phase 5-6 (Dual Write)**:
```bash
DB_READS=mongo
DB_WRITES=dual
```

**Phase 7 (Read Cutover)**:
```bash
DB_READS=supabase
DB_WRITES=dual
```

**Phase 8+ (Full Supabase)**:
```bash
DB_READS=supabase
DB_WRITES=supabase
```

---

## Success Criteria

### **Each PR Must**:
- ✅ Pass all existing tests
- ✅ Maintain API contract compatibility
- ✅ Include new tests for added functionality
- ✅ Update relevant documentation
- ✅ Be independently deployable
- ✅ Include rollback instructions

### **Overall Migration Success**:
- 🎯 Zero downtime during cutover
- 🎯 100% data consistency validation
- 🎯 Performance equal or better than before
- 🎯 All tests passing on Supabase
- 🎯 Complete removal of MongoDB dependencies

---

## Risk Mitigation

- **Small PRs**: Each can be reverted independently
- **Comprehensive Testing**: Catch issues early
- **Dual-Write Safety**: Never lose data during migration
- **Incremental Cutover**: Test each step thoroughly
- **Rollback Plan**: Clear procedures for each phase

---

*Last Updated: August 30, 2025*  
*Next Review: After each PR completion*
# Database Migration Plan: MongoDB → PostgreSQL (Supabase)

## ⚠️ Current Status: BLOCKED on MongoDB Credentials

**Active Phase**: PR #1 - DAL Foundation  
**Progress**: Implementation Complete, **BLOCKED** on MongoDB connection  
**Blocker**: Need valid MongoDB credentials in `.env` file (currently has placeholder values)  
**Next Action**: Update `.env` with real credentials → test → create PR #1  
**Branch**: `feature/dal-foundation-pr1` (ready to commit once tested)

📋 **See NEXT_STEPS.md for immediate action items**

---

## Overview

Safe, incremental migration from MongoDB to PostgreSQL using a Database Abstraction Layer (DAL) with dual-write capabilities.

## Migration Philosophy

- **Safety First**: Each step is reversible and testable
- **Incremental Progress**: Small PRs that don't depend on each other
- **Continuous Validation**: Tests for each increment
- **Documentation**: Keep all docs up-to-date with progress

## PR-Based Implementation Strategy

### **PR #1: DAL Foundation & MongoDB Adapter** 🔄 *IN PROGRESS*
**Goal**: Establish DAL architecture with MongoDB adapter

**Scope**:
- ✅ DAL interfaces and factory
- 🔄 MongoDB adapter implementation
- ✅ Configuration setup
- 📝 Basic tests for adapter
- 📝 Update documentation

**Testing**:
- MongoDB adapter connects properly
- All CRUD operations work through DAL
- Existing API behavior unchanged

**Acceptance Criteria**:
- All existing endpoints work identically
- Tests pass
- Health check shows MongoDB connection via DAL

---

### **PR #2: Token Controller Migration**
**Goal**: Migrate token-related endpoints to use DAL

**Scope**:
- Update `tokenController.js` to use DAL
- Keep all existing API contracts
- Add DAL-specific tests
- Update API documentation

**Testing**:
- Token CRUD operations via DAL
- Multi-tenant filtering works
- Performance benchmarks match

**Acceptance Criteria**:
- All token endpoints use DAL
- No breaking changes to API responses
- Tests verify identical behavior

---

### **PR #3: Auth & User Management Migration**
**Goal**: Migrate authentication and user management

**Scope**:
- Update `authController.js`, `membershipController.js`
- Migrate user, tenant, membership operations
- Preserve JWT/API key authentication

**Testing**:
- Login/authentication flows
- Role-based authorization
- User-tenant relationships

---

### **PR #4: API Keys & Invitations Migration**
**Goal**: Migrate API key and invitation systems

**Scope**:
- Update `apiKeyController.js`, `invitationController.js`
- Preserve API key authentication
- Maintain invitation workflows

**Testing**:
- API key generation and validation
- Invitation creation and acceptance
- Authorization scopes

---

### **PR #5: Supabase Adapter Implementation**
Status: Completed early to enable PR #2 cutover

**Delivered**:
- Implemented `SupabaseAdapter` class using Prisma
- Mapped core operations (users, tenants, projects, tokens, memberships, categories, api keys, invitations, releases)
- Health check via Prisma `$queryRaw` (SELECT 1)

---

### **PR #6: Dual-Write System**
**Goal**: Implement safe dual-write capability

**Scope**:
- `DualWriteAdapter` implementation
- Write to both databases simultaneously
- Comparison and validation logic
- Error handling and rollback

**Testing**:
- Dual-write creates identical records
- Handles partial failures gracefully
- Comparison reports any discrepancies

---

### **PR #7: Data Migration Scripts**
**Goal**: Tools for migrating existing data

**Scope**:
- Backfill script (MongoDB → Supabase)
- Data validation and comparison
- Incremental sync capabilities
- Rollback procedures

**Testing**:
- Complete data migration in test environment
- Validation reports 100% consistency
- Performance within acceptable limits

---

### **PR #8: Health & Monitoring Updates**
**Goal**: Update observability for dual-database setup

**Scope**:
- Health endpoints include both databases
- Status endpoint shows read/write modes
- Connection monitoring
- Performance metrics

**Testing**:
- Health checks work for both databases
- Status accurately reflects configuration
- Monitoring catches connection issues

---

### **PR #9: Migration Cutover Procedures**
**Goal**: Safe production cutover process

**Scope**:
- Environment variable management
- Cutover validation checklist
- Rollback procedures
- Performance monitoring

**Testing**:
- Cutover process in staging
- Rollback procedures
- Performance under load

---

### **PR #10: Cleanup & Optimization**
**Goal**: Remove MongoDB dependencies post-migration

**Scope**:
- Remove MongoDB adapter and dependencies
- Clean up dual-write code
- Optimize Supabase queries
- Update documentation

**Testing**:
- Full test suite against Supabase only
- Performance optimization validation
- Documentation accuracy

---

## Testing Strategy

### **Per-PR Testing**
- Unit tests for new components
- Integration tests for affected endpoints
- Performance benchmarks
- Manual testing checklist

### **Migration-Specific Tests**
- Data consistency validation
- Performance comparison (before/after)
- Dual-write correctness
- Rollback procedures

### **Long-term Tests to Keep**
- Database connection health checks
- Data integrity validation
- Performance monitoring
- Multi-tenant isolation tests

### **Tests to Deprecate Post-Migration**
- MongoDB-specific tests
- Dual-write validation tests
- Migration comparison scripts
- Legacy adapter tests

---

## Configuration Management

### **Environment Variables by Phase**

**Phase 1-4 (MongoDB Only)**:
```bash
DB_READS=mongo
DB_WRITES=mongo
```

**Phase 5-6 (Dual Write)**:
```bash
DB_READS=mongo
DB_WRITES=dual
```

**Phase 7 (Read Cutover)**:
```bash
DB_READS=supabase
DB_WRITES=dual
```

**Phase 8+ (Full Supabase)**:
```bash
DB_READS=supabase
DB_WRITES=supabase
```

---

## Success Criteria

### **Each PR Must**:
- ✅ Pass all existing tests
- ✅ Maintain API contract compatibility
- ✅ Include new tests for added functionality
- ✅ Update relevant documentation
- ✅ Be independently deployable
- ✅ Include rollback instructions

### **Overall Migration Success**:
- 🎯 Zero downtime during cutover

