# Design Token Manager API - AI Assistant Guide

This document provides essential context for AI assistants working with the Design Token Manager API codebase.

> **📋 Project History**: For detailed project history and major decisions, see [CHANGELOG.md](CHANGELOG.md)  
> **🗺️ Future Plans**: For development roadmap and planned features, see [ROADMAP.md](ROADMAP.md)

## Project Overview

**Purpose**: Multi-tenant RESTful API for managing design tokens with enterprise-grade features.

**Current State**: Supabase/PostgreSQL via Prisma with Database Abstraction Layer (DAL). Stage 1 migration complete, currently in Stage 1.1 (post-migration polish & production readiness).
**Architecture**: Multi-tenant SaaS (Tenant → Project → Tokens)
**Version**: 0.3.2 (Platform admin support, project assignments, dashboard endpoints)
**Skills System**: ✅ Claude Code skills installed for automated best practices (see `.claude/README.md`)

## Quick Start Commands

```bash
# Setup (first time)
cp .env.example .env
# Edit .env with your Supabase credentials (see TESTING_LOCAL_SUPABASE.md)
npm install
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema to database
npm run bootstrap:supabase    # Create tenant, project, user, API key

# Development
npm run dev                    # Start dev server (http://localhost:4000)
npm run lint                   # Run linter
npm test                       # Run all tests
npm run test:supabase          # Run Supabase integration tests
npm run local:verify           # Status + tests + smoke tests

# Production
npm start                      # Production server
```

## Project Structure

```
src/
├── config/
│   ├── prisma.js             # Prisma client configuration (active)
│   ├── supabase.js           # Supabase client configuration
│   └── versioning.js         # API versioning config
├── dal/                      # Database Abstraction Layer
│   ├── interfaces/
│   │   └── DatabaseAdapter.js # DAL interface contract
│   ├── adapters/
│   │   └── SupabaseAdapter.js # Supabase/Prisma adapter (active)
│   ├── DatabaseFactory.js   # Adapter factory
│   └── DatabaseService.js   # Main DAL service
├── controllers/              # Business logic
│   ├── tokenController.js    # Token CRUD operations
│   ├── authController.js     # Authentication (login)
│   ├── apiKeyController.js   # API key management
│   ├── invitationController.js # Team invitations
│   ├── membershipController.js # Team memberships
│   ├── categoryController.js # Token categories
│   ├── importController.js   # Bulk import
│   └── tokenReleaseController.js # Version releases
├── middleware/
│   ├── verifyJWT.js         # JWT authentication
│   ├── verifyApiKey.js      # API key authentication
│   ├── tenantContext.js     # Multi-tenant context
│   ├── requireRole.js       # Role-based authorization
│   ├── versioning.js        # API versioning
│   └── errorHandler.js      # Global error handling
├── generated/               # Generated code
│   └── prisma/             # Prisma client (generated)
├── routes/                 # Express routes
│   ├── tokens.js           # Token endpoints
│   ├── auth.js             # Authentication
│   ├── apiKeys.js          # API key management
│   ├── invitations.js      # Team invitations
│   ├── memberships.js      # Team memberships
│   ├── categories.js       # Categories
│   ├── releases.js         # Token releases
│   └── status.js           # Health checks
├── scripts/                # Database and utility scripts
│   ├── bootstrapSupabase.js # Initialize Supabase data
│   ├── smokeSupabase.js     # Smoke tests for tokens
│   ├── smokeAll.js          # All smoke tests
│   └── checkStatus.js       # Health check script
└── index.js                 # Express app entry point

tests/                       # Test suites
├── supabase/               # Supabase integration tests
│   ├── tokens.apiKey.supabase.test.js
│   ├── invitations.memberships.supabase.test.js
│   └── releases.supabase.test.js
├── integration/endpoints/  # API endpoint tests
├── helpers/               # Test utilities
└── setup/                 # Test environment setup

prisma/                     # Prisma schema and migrations
└── schema.prisma          # Database schema definition
```

## Database Abstraction Layer (DAL)

**Status**: ✅ Supabase-only runtime via Prisma (migration complete)

The DAL provides a unified interface for database operations, enabling flexible database operations without coupling controllers to specific database implementations.

### Architecture Components

**DatabaseService** (`src/dal/DatabaseService.js`): Main service used throughout the application
- Singleton instance providing read/write operations
- Separates read and write adapters for flexibility
- Handles initialization and connection management

**DatabaseFactory** (`src/dal/DatabaseFactory.js`): Creates appropriate adapters based on environment
- Loads SupabaseAdapter when `DB_READS` or `DB_WRITES` is set to 'supabase'

**Adapters** (`src/dal/adapters/`):
- **SupabaseAdapter**: Prisma/PostgreSQL implementation (active)

### Configuration

```bash
# Current state (Supabase only)
DB_READS=supabase
DB_WRITES=supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

### Usage in Controllers

All controllers use the DAL for database operations:
```javascript
import databaseService from '../dal/DatabaseService.js';

// Token operations
const token = await databaseService.findTokenById(id);
const tokens = await databaseService.findTokensByProject(tenantId, projectId);

// User operations
const user = await databaseService.findUserByUsername(username);

// Tenant operations
const tenant = await databaseService.findTenantById(tenantId);
```

### Testing

Supabase integration tests are in `tests/supabase/`:
- `tokens.apiKey.supabase.test.js`: Token operations with API key auth
- `invitations.memberships.supabase.test.js`: Invitations and memberships
- `releases.supabase.test.js`: Token releases

Run Supabase tests: `npm run test:supabase`

---

## Key Concepts

### Multi-Tenancy
- **Tenant**: Organization/company using the service
- **Project**: Collection of design tokens within a tenant
- **User**: Can belong to multiple tenants with different roles

### Authentication & Authorization
- **JWT Auth**: For admin users, full API access
- **API Key Auth**: Project-scoped, limited to token operations
- **Roles**: admin (full access), editor (create/edit), viewer (read-only)

### Data Models

**Token Schema**:
```javascript
{
  tenant: ObjectId,      // Which organization
  project: ObjectId,     // Which project
  name: String,          // Token name (e.g., "primary-color")
  value: String,         // Token value (e.g., "#007bff")
  category: String,      // Type: color, spacing, font, shadow, other
  description: String    // Optional description
}
```

**API Key Schema**:
```javascript
{
  tenant: ObjectId,
  project: ObjectId,     // Scoped to single project
  scopes: [String],      // ["read:tokens", "write:tokens"]
  keyHash: String,       // Hashed API key value
  createdBy: ObjectId    // User who created it
}
```

## Environment Variables

Required `.env` variables:
```bash
PORT=4000                                    # Server port
DATABASE_URL=postgresql://...                # Supabase PostgreSQL connection
SUPABASE_URL=https://...supabase.co         # Supabase project URL
SUPABASE_ANON_KEY=...                       # Supabase anonymous key
DB_READS=supabase                           # Read operations database
DB_WRITES=supabase                          # Write operations database
JWT_SECRET=your_secure_random_string         # JWT signing key
JWT_EXPIRES_IN=1h                           # JWT expiration
CLIENT_URL=http://localhost:5173            # Frontend URL (CORS)
```

## API Authentication

### JWT Authentication
```bash
# Login to get JWT
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "Admin#123"
}

# Use JWT in subsequent requests
Authorization: Bearer <jwt_token>
```

### API Key Authentication
```bash
# Create API key (requires admin JWT)
POST /api/v1/api-keys
Authorization: Bearer <jwt_token>
{
  "scopes": ["read:tokens", "write:tokens"]
}

# Use API key for token operations
Authorization: Bearer <api_key>
```

## Common Development Tasks

### Adding New Endpoints
1. Create controller function in `src/controllers/`
2. Add route in appropriate `src/routes/` file
3. Add Swagger documentation
4. Update authentication/authorization middleware
5. Add tests in `tests/integration/endpoints/`

### Database Operations
- All operations use the DAL (DatabaseService)
- Prisma handles type-safe database queries
- All operations include tenant/project filtering
- Use `tenantContext` middleware for automatic scoping

### Testing
- Unit tests: individual functions
- Integration tests: full API endpoints via Supabase
- Use smoke tests for quick validation (`npm run smoke:all`)
- Supabase provides isolated test environments

## Deployment Considerations

- **Database**: Requires Supabase PostgreSQL (with connection pooling)
- **Environment**: Node.js 18+
- **Prisma**: Ensure `postinstall` script generates Prisma client (`npx prisma generate`)
- **Security**: Ensure JWT_SECRET is cryptographically secure
- **Scaling**: Stateless API, can horizontally scale with Supabase pooling
- **Monitoring**: Health checks at `/status/database` and `/status/postgres`

## Troubleshooting

### Common Issues
1. **Database connection error**: Check DATABASE_URL and SUPABASE_URL in `.env`
2. **Prisma client not generated**: Run `npx prisma generate`
3. **JWT errors**: Verify JWT_SECRET is set
4. **API key auth fails**: Check scopes and project association
5. **Tests failing**: Ensure Supabase credentials are correct

### Debug Commands
```bash
# Check database connection
curl http://localhost:4000/status/postgres
curl http://localhost:4000/status/database

# View API documentation
open http://localhost:4000/api-docs/v1

# Run specific Supabase test
npm run test:supabase

# Run all smoke tests
npm run smoke:all
```

## Code Conventions

- **ES Modules**: Use import/export syntax
- **Async/Await**: Preferred over promises
- **Error Handling**: Use centralized error handler
- **Validation**: express-validator for input validation
- **Documentation**: Swagger JSDoc comments required for all endpoints
- **Database**: Prisma ORM for type-safe database operations via DAL
- **Schema**: Prisma schema in `prisma/schema.prisma`

## Security Features

- Password hashing with bcrypt
- JWT with configurable expiration
- API key hashing (not stored in plaintext)
- Input validation and sanitization
- CORS configuration
- Role-based access control
- Tenant isolation (no cross-tenant data access)

## Claude Code Skills System

This project includes an automated skills system that helps maintain code quality and enforce best practices.

### Installed Skills

**api-development-standards** (Custom for this API):
- Auto-activates when working with controllers, routes, middleware
- Enforces multi-tenant isolation (CRITICAL)
- Enforces DAL usage (no direct Prisma in controllers)
- Controller structure and error handling patterns
- Authentication/authorization patterns

**code-comment-standards**:
- Maintains clean, maintainable comments
- Removes temporal references (Phase X, Task Y)
- Enforces JSDoc standards

**project-planning**:
- Creates standardized plan documents in `/docs/plans/`
- Structured format with success criteria
- Sequential numbering (no decimals)

**step-by-step-execution**:
- Methodical implementation approach
- Plan → Propose → Execute → Test cycle
- Prevents breaking changes

**skill-developer** (Meta):
- Helps create new skills
- Explains skill system mechanics

### How Skills Work

Skills auto-activate via hooks based on:
- Keywords in prompts ("controller", "database", "plan")
- Intent patterns (regex matching actions)
- Files being edited (controllers, routes, middleware)

**Configuration**: `.claude/skills/skill-rules.json`
**Documentation**: `.claude/README.md`

### For AI Assistants

When working with this codebase:
- Skills will auto-suggest via the hook system
- **api-development-standards** is critical - always follow multi-tenant patterns
- Use **step-by-step-execution** for complex refactoring
- Use **project-planning** for Stage 1.1+ features

---

When working with this codebase, always consider multi-tenancy implications and ensure proper authentication/authorization for all operations.
