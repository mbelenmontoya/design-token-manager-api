# Design Token Manager API - AI Assistant Guide

This document provides essential context for AI assistants working with the Design Token Manager API codebase.

> **📋 Project History**: For detailed project history and major decisions, see [CHANGELOG.md](CHANGELOG.md)  
> **🗺️ Future Plans**: For development roadmap and planned features, see [ROADMAP.md](ROADMAP.md)

## Project Overview

**Purpose**: Multi-tenant RESTful API for managing design tokens with enterprise-grade features.

**Current State**: Supabase/PostgreSQL via Prisma behind a DAL. Legacy Mongo/Mongoose notes below are historical.  
**Architecture**: Multi-tenant SaaS (Tenant → Project → Tokens)
**Latest**: v0.3.3 with dashboard endpoints for tenant creation and admin invitations (Sept 2025)

## Quick Start Commands

```bash
# Setup (first time)
cp .env.example .env
# Edit .env with your Supabase credentials (see TESTING_LOCAL_SUPABASE.md)
npm install
node scripts/seedUser.js

# Development
npm run dev                    # Start dev server (http://localhost:4000)
npm run lint                   # Run linter
npm test                       # Run all tests
npm run test:endpoints         # Run integration tests

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
│   │   ├── SupabaseAdapter.js # Supabase/Prisma adapter (active)
│   │   └── (Legacy adapters removed)
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
├── models/                  # Mongoose schemas
│   ├── Token.js            # Design tokens
│   ├── User.js             # Users
│   ├── Tenant.js           # Organizations
│   ├── Project.js          # Projects within tenants
│   ├── ApiKey.js           # API keys for projects
│   ├── Invitation.js       # Team invitations
│   ├── Membership.js       # User-tenant relationships
│   ├── Category.js         # Token categories
│   └── TokenRelease.js     # Token version releases
├── routes/                 # Express routes
│   ├── tokens.js           # Token endpoints
│   ├── auth.js             # Authentication
│   ├── apiKeys.js          # API key management
│   ├── invitations.js      # Team invitations
│   ├── memberships.js      # Team memberships
│   ├── categories.js       # Categories
│   ├── releases.js         # Token releases
│   └── status.js           # Health checks
├── scripts/                # Database utilities
│   ├── seedUser.js         # Create initial admin user
│   ├── seedCategories.js   # Seed default categories
│   └── migrateTokens.js    # Data migration script
└── index.js               # Express app entry point

tests/                     # Test suites
├── dal/                  # Database Abstraction Layer tests
├── integration/endpoints/ # API endpoint tests
├── helpers/              # Test utilities
└── setup/               # Test environment setup

prisma/                   # Prisma schema and migrations
└── schema.prisma        # Database schema definition
```

## Database Abstraction Layer (DAL)

**Status**: ✅ Supabase-only runtime (migration complete; Mongo notes historical)

The DAL provides a unified interface for database operations, enabling seamless migration between database systems without changing application logic.

### Architecture Components

**DatabaseService** (`src/dal/DatabaseService.js`): Main service used throughout the application
- Singleton instance providing read/write operations
- Separates read and write adapters for flexibility
- Handles initialization and connection management

**DatabaseFactory** (`src/dal/DatabaseFactory.js`): Creates appropriate adapters based on environment
- `DB_READS`: supabase
- `DB_WRITES`: supabase

**Adapters** (`src/dal/adapters/`):
- **SupabaseAdapter**: Prisma/PostgreSQL implementation (active)

### Configuration

```bash
# Current (MongoDB only)
DB_READS=mongo
DB_WRITES=mongo

# Migration phases
DB_READS=mongo
DB_WRITES=dual      # Write to both MongoDB and Supabase

# Target state (Supabase only)
DB_READS=supabase
DB_WRITES=supabase
```

### Usage in Controllers

**Before (Direct Mongoose)**:
```javascript
const token = await Token.findById(id);
```

**After (DAL)**:
```javascript
import databaseService from '../dal/DatabaseService.js';
const token = await databaseService.findTokenById(id);
```

### Testing

DAL tests are in `tests/dal/`:
- `MongoAdapter.test.js`: MongoDB adapter functionality
- `DatabaseService.test.js`: Service layer and factory

Run DAL tests: `npm test -- tests/dal/`

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
MONGO_URI=mongodb+srv://...                  # MongoDB connection
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
- Models use Mongoose ODM
- All operations should include tenant/project filtering
- Use `tenantContext` middleware for automatic scoping

### Testing
- Unit tests: individual functions
- Integration tests: full API endpoints
- Use factories in `tests/helpers/factories.js`
- MongoDB Memory Server for isolated test database

## Deployment Considerations

- **Database**: Requires MongoDB (Atlas recommended)
- **Environment**: Node.js 18+
- **Security**: Ensure JWT_SECRET is cryptographically secure
- **Scaling**: Stateless API, can horizontally scale
- **Monitoring**: Health checks at `/health` and `/status`

## Troubleshooting

### Common Issues
1. **MongoDB connection error**: Check MONGO_URI in `.env`
2. **JWT errors**: Verify JWT_SECRET is set
3. **API key auth fails**: Check scopes and project association
4. **Tests failing**: Ensure test database isolation

### Debug Commands
```bash
# Check database connection
curl http://localhost:4000/health

# View API documentation
open http://localhost:4000/api-docs/v1

# Run specific test suite
npm run test:endpoints -- --testNamePattern="tokens"
```

## Code Conventions

- **ES Modules**: Use import/export syntax
- **Async/Await**: Preferred over promises
- **Error Handling**: Use centralized error handler
- **Validation**: express-validator for input validation
- **Documentation**: Swagger JSDoc comments required for all endpoints
- **Database**: Mongoose for ODM, schema validation enabled

## Security Features

- Password hashing with bcrypt
- JWT with configurable expiration
- API key hashing (not stored in plaintext)
- Input validation and sanitization
- CORS configuration
- Role-based access control
- Tenant isolation (no cross-tenant data access)

---

## 📋 Current Development Status (September 2025)

### ✅ Recently Completed (v0.3.3)

**Dashboard Endpoints Implementation**:
- `POST /api/v1/tenants` - Platform admin can create tenants with automatic admin invitations
- `POST /api/v1/invitations/validate` - Validate invitation tokens (no auth required)
- `POST /api/v1/invitations/accept` - Accept invitations and create user accounts (no auth required)

**Database Schema Extensions**:
- Extended `Tenant` with `description`, `industry` fields
- Enhanced `Invitation` with `adminName`, `isTenantCreation`, optional `inviterId`
- Applied migrations to Supabase/PostgreSQL

**Security & Features**:
- JWT auto-generation on invitation acceptance for immediate login
- 72-hour token expiration with SHA-256 hashing
- Comprehensive input validation and error handling
- Complete Swagger documentation for all new endpoints

### 🔄 Current Branch Status

- **Active Branch**: `feature/dashboard-endpoints`
- **PR Status**: #31 open and ready for merge
- **Commit**: 7f4e0da with comprehensive implementation
- **Testing**: All endpoints tested and working locally

### 🚀 Next Development Priorities (in order)

1. **Billing Integration (Mercado Pago)** - NEXT UP
   - Payment processing for LATAM markets
   - Subscription management and billing cycles
   - Usage tracking and plan limits

2. **Error Standardization**
   - Unified error envelope across all controllers
   - Consistent error codes and messaging

3. **CI/CD Pipeline** (final priority)
   - Automated testing and deployment
   - Server startup and smoke tests

### 🛠️ Development Workflow

**For next session**:
1. Merge PR #31 if approved
2. `git checkout main && git pull`
3. Create new feature branch: `git checkout -b feature/billing-mercadopago`
4. Implement billing endpoints following same patterns
5. Test thoroughly, commit, push, create PR

**Key Files to Reference**:
- `CHANGELOG.md` - Complete feature history and changes
- `TESTING_LOCAL_SUPABASE.md` - Local development and testing guide
- `ROADMAP.md` - Long-term project direction
- This file (`CLAUDE.md`) - Development context and current status

---

When working with this codebase, always consider multi-tenancy implications and ensure proper authentication/authorization for all operations.
