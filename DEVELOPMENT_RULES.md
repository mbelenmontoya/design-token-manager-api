# Design Token Manager API - Development Rules

## 🚨 MANDATORY: Start of Session Protocol

### 1. **Always Check Documentation First**
Before starting any development work, review these files in order:

1. **[CHANGELOG.md](CHANGELOG.md)** - What happened recently?
2. **[ROADMAP.md](ROADMAP.md)** - What's the current stage and priorities?
3. **[README.md](README.md)** - Quick reference for setup and commands
4. **[CLAUDE.md](CLAUDE.md)** - Technical context and AI assistant guide

### 2. **Check Current System Status**
```bash
# Always run these commands at session start:
npm run lint                   # Check code quality
npm test                      # Verify tests pass
npm run test:endpoints        # Check API integration tests
curl http://localhost:4000/health  # Check system health
```

### 3. **Understand Current Stage**
- **Current Stage**: Stage 1 - Foundations & Migration (PostgreSQL + Prisma)
- **Priority**: Database migration with dual-write system
- **Focus**: DAL layer, Prisma schema, backfill scripts

---

## 🚨 MANDATORY: End of Session Protocol

### When User Says "Session Finished for Today"

1. **Update CHANGELOG.md** with what was accomplished:
   ```markdown
   ## [Unreleased]
   
   ### Added
   - [List new endpoints/features added]
   
   ### Changed
   - [List database/API modifications]
   
   ### Fixed
   - [List bugs/issues resolved]
   
   ### Technical
   - [List infrastructure/migration progress]
   ```

2. **Update ROADMAP.md** if stage progress was made:
   - Update "Current Status" checkboxes for Stage 1
   - Add new technical priorities if discovered
   - Update acceptance criteria progress

3. **Run Final Checks**:
   ```bash
   npm run lint                 # Ensure code quality
   npm test                    # Verify all tests pass
   npm run test:endpoints      # Check API integration
   ```

4. **Document Database Migration Progress**:
   - Note Prisma schema changes
   - Document DAL layer progress
   - Record any dual-write implementation steps

---

## Development Guidelines

### Database Migration (Stage 1 Priority)
- **Prisma first**: Define schema in Prisma, generate migrations
- **DAL pattern**: All database calls through Data Access Layer
- **Dual-write**: Support both MongoDB and PostgreSQL during transition
- **No breaking changes**: API contracts must remain stable

### API Development
- **OpenAPI first**: Document endpoints before implementing
- **Multi-tenant**: Always filter by tenant/project context
- **Authentication**: Support both JWT and API key auth
- **Validation**: Use express-validator for all inputs

### Code Standards
- **ES Modules**: Use import/export syntax
- **Async/await**: Preferred over promises
- **Error handling**: Use centralized error handler
- **Testing**: Write tests for all new endpoints

### Security
- **Tenant isolation**: No cross-tenant data access
- **Input validation**: Validate and sanitize all inputs
- **API key hashing**: Never store keys in plaintext
- **JWT security**: Proper token validation and expiration

---

## Current Stage 1 Priorities

### ❌ **Must Complete Before Stage 2**
1. **PostgreSQL + Prisma setup**: Schema definition and connection
2. **DAL layer implementation**: MongoDB and PostgreSQL adapters
3. **Dual-write system**: Environment-based database selection
4. **Backfill scripts**: Data migration and comparison tools
5. **Health endpoints**: PostgreSQL status in `/health`
6. **CI schema validation**: Automated schema checks

### ✅ **Already Complete**
- Express.js API foundation
- MongoDB with Mongoose ODM
- JWT and API key authentication
- Multi-tenant architecture
- Comprehensive test suite
- Swagger documentation

---

## Database Migration Strategy

### Phase 1: Setup (Current)
```bash
# Environment variables to add:
DB_READS=mongo              # mongo|postgres
DB_WRITES=mongo             # mongo|dual|postgres
POSTGRES_URL=postgresql://...
```

### Phase 2: Dual-Write
- Write to both MongoDB and PostgreSQL
- Read from MongoDB (existing behavior)
- Compare data consistency

### Phase 3: Read Cutover
- Switch reads to PostgreSQL
- Continue dual-write for safety
- Monitor for issues

### Phase 4: Write Cutover
- Switch writes to PostgreSQL only
- Remove MongoDB adapter
- Clean up legacy code

---

## File Structure Rules

### ✅ **Correct Documentation Structure**
```
/
├── CHANGELOG.md              # What happened when
├── ROADMAP.md               # What's planned (5 stages)
├── README.md                # Setup and quick reference
├── DEVELOPMENT_RULES.md     # This file
├── CLAUDE.md                # AI assistant context
└── docs/
    ├── PRD.md              # Product requirements
    ├── TECHNICAL_SPECIFICATION.md
    └── PROJECT_OUTLINE.md
```

### ✅ **Expected New Files (Stage 1)**
```
src/
├── dal/                     # Data Access Layer
│   ├── interfaces/         # DAL interfaces
│   ├── adapters/           # MongoDB & PostgreSQL adapters
│   └── index.js           # DAL factory
├── prisma/
│   ├── schema.prisma      # Prisma schema
│   └── migrations/        # Database migrations
└── scripts/
    ├── backfill.js        # Data migration
    └── compare.js         # Data consistency checks
```

---

## API Contract Rules

### ✅ **Must Maintain**
- All existing endpoint URLs
- Request/response formats
- Authentication methods
- Error response structure

### ✅ **Can Add**
- New optional query parameters
- New response fields
- New endpoints
- Deprecation headers (for future changes)

### ❌ **Cannot Change**
- Existing endpoint URLs
- Required request fields
- Response field types
- HTTP status codes

---

## Emergency Procedures

### If Database Connection Fails
1. Check `/health` endpoint status
2. Verify environment variables
3. Check database service availability
4. Document in CHANGELOG.md

### If Tests Fail
1. Check database test isolation
2. Verify seed data consistency
3. Check for schema changes
4. Update test fixtures if needed

### If API Breaks
1. Check recent controller changes
2. Verify middleware chain
3. Check authentication flow
4. Revert if necessary and document

### If Migration Issues
1. Stop dual-write if data inconsistent
2. Check backfill script logs
3. Compare data between databases
4. Document issues in ROADMAP.md

---

## Health Check Requirements

### `/health` Endpoint Must Return
```json
{
  "status": "ok",
  "timestamp": "2024-12-19T10:30:00Z",
  "database": {
    "mongodb": "connected",
    "postgresql": "connected"  // Add in Stage 1
  }
}
```

### `/status` Endpoint Must Return
```json
{
  "version": "1.0.0",
  "environment": "development",
  "storage": {
    "reads": "mongo",     // mongo|postgres
    "writes": "mongo"     // mongo|dual|postgres
  }
}
```

---

**Remember: API stability is critical. Never break existing contracts without proper versioning and deprecation.**
