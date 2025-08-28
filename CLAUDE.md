# Design Token Manager API - AI Assistant Guide

This document provides essential context for AI assistants working with the Design Token Manager API codebase.

> **📋 Project History**: For detailed project history and major decisions, see [CHANGELOG.md](CHANGELOG.md)  
> **🗺️ Future Plans**: For development roadmap and planned features, see [ROADMAP.md](ROADMAP.md)

## Project Overview

**Purpose**: Multi-tenant RESTful API for managing design tokens with enterprise-grade features.

**Current State**: Express + MongoDB, planned migration to PostgreSQL + Prisma  
**Architecture**: Multi-tenant SaaS (Tenant → Project → Tokens)

## Quick Start Commands

```bash
# Setup (first time)
cp .env.example .env
# Edit .env with your MongoDB credentials
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
│   ├── db.js                 # MongoDB connection
│   └── versioning.js         # API versioning config
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
├── integration/endpoints/ # API endpoint tests
├── helpers/              # Test utilities
└── setup/               # Test environment setup
```

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

When working with this codebase, always consider multi-tenancy implications and ensure proper authentication/authorization for all operations.