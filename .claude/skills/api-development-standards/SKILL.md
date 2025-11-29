---
name: api-development-standards
description: Node.js/Express/Prisma/PostgreSQL development patterns for Design Token Manager API. Use when working with controllers, routes, middleware, DAL, or database operations. Enforces multi-tenant isolation, Prisma best practices, Express patterns, authentication, and API response standards.
---

# 🔧 API Development Standards

Enforces architectural patterns and best practices for the Design Token Manager API (Node.js/Express/Prisma/PostgreSQL).

## When to Use This Skill

**ALWAYS activate when:**

- Creating or modifying API routes
- Building controllers or services
- Database operations with Prisma
- Adding middleware (auth, validation, tenant context)
- Multi-tenant data operations
- API authentication (JWT, API keys)
- Error handling and validation
- Writing tests for endpoints

## Architecture Overview

### Three-Layer Architecture

```
ROUTES (Express)
    ↓
CONTROLLERS (Business Logic)
    ↓
DAL (Database Abstraction Layer)
    ↓
PRISMA (ORM)
    ↓
POSTGRESQL (Supabase)
```

**Key principles:**
- Routes handle HTTP concerns only (validation, auth)
- Controllers contain business logic
- DAL provides database abstraction
- Prisma performs type-safe queries
- All data operations enforce tenant/project isolation

## Core Standards

### 1. Multi-Tenant Data Isolation

**CRITICAL**: Every database query MUST include tenant/project filtering.

✅ **CORRECT:**
```javascript
// Controller with tenant/project filtering
async function getTokens(req, res, next) {
  const { tenantId, projectId } = req.tenant; // From tenantContext middleware

  const tokens = await databaseService.findTokensByProject(tenantId, projectId);
  res.json({ tokens });
}
```

❌ **WRONG:**
```javascript
// Missing tenant/project isolation - SECURITY VULNERABILITY
async function getTokens(req, res, next) {
  const tokens = await databaseService.findAllTokens(); // NO FILTERING!
  res.json({ tokens });
}
```

**Rules:**
- NEVER query without tenant/project filtering
- Use `tenantContext` middleware to extract tenant/project IDs
- DAL methods already enforce isolation - use them
- Test multi-tenant isolation in integration tests

### 2. Database Access via DAL

**ALWAYS** use the Database Abstraction Layer, never direct Prisma calls in controllers.

✅ **CORRECT:**
```javascript
import databaseService from '../dal/DatabaseService.js';

async function createToken(req, res, next) {
  const { tenantId, projectId } = req.tenant;
  const tokenData = req.body;

  const token = await databaseService.createToken({
    ...tokenData,
    tenantId,
    projectId
  });

  res.status(201).json({ token });
}
```

❌ **WRONG:**
```javascript
import prisma from '../config/prisma.js';

async function createToken(req, res, next) {
  // Direct Prisma access bypasses DAL abstraction
  const token = await prisma.token.create({
    data: req.body
  });
  res.json({ token });
}
```

**Why:**
- DAL provides database flexibility (could switch from Supabase)
- DAL methods enforce tenant isolation
- Consistent patterns across controllers
- Easier testing with DAL mocks

### 3. Controller Structure

Controllers should follow this pattern:

```javascript
import databaseService from '../dal/DatabaseService.js';

/**
 * Get all tokens for a project
 * @route GET /api/v1/tokens
 */
export async function listTokens(req, res, next) {
  try {
    const { tenantId, projectId } = req.tenant; // From middleware
    const { page = 1, limit = 20, category } = req.query;

    // Business logic
    const tokens = await databaseService.findTokensByProject(
      tenantId,
      projectId,
      { page, limit, category }
    );

    // Response
    res.json({
      tokens,
      pagination: { page, limit, total: tokens.length }
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
}

/**
 * Create a new token
 * @route POST /api/v1/tokens
 */
export async function createToken(req, res, next) {
  try {
    const { tenantId, projectId } = req.tenant;
    const tokenData = req.body;

    // Validation happens in route middleware
    // Business logic here
    const token = await databaseService.createToken({
      ...tokenData,
      tenantId,
      projectId
    });

    res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
}
```

**Key points:**
- Try/catch with `next(error)` for centralized error handling
- Extract tenant/project from `req.tenant` (middleware)
- JSDoc comments for route documentation
- Return consistent JSON responses
- Proper HTTP status codes (201 for created, 200 for success)

### 4. Route Structure

Routes handle HTTP concerns, delegate to controllers:

```javascript
import express from 'express';
import { body, query } from 'express-validator';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole } from '../middleware/requireRole.js';
import * as tokenController from '../controllers/tokenController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/tokens:
 *   get:
 *     summary: List tokens for a project
 *     tags: [Tokens]
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/',
  verifyJWT,           // Authentication
  tenantContext,       // Multi-tenant context
  requireRole(['admin', 'editor', 'viewer']), // Authorization
  query('category').optional().isString(),     // Validation
  tokenController.listTokens // Controller
);

/**
 * @swagger
 * /api/v1/tokens:
 *   post:
 *     summary: Create a new token
 */
router.post(
  '/',
  verifyJWT,
  tenantContext,
  requireRole(['admin', 'editor']), // Only admin/editor can create
  body('name').notEmpty().isString(),
  body('value').notEmpty().isString(),
  body('category').optional().isString(),
  tokenController.createToken
);

export default router;
```

**Middleware order matters:**
1. Authentication (`verifyJWT` or `verifyApiKey`)
2. Tenant context (`tenantContext`)
3. Authorization (`requireRole`)
4. Validation (`express-validator`)
5. Controller

### 5. Prisma/DAL Best Practices

When working in the DAL layer:

✅ **Use transactions for multiple operations:**
```javascript
async createTokenWithCategory(tokenData) {
  return await this.prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: { name: tokenData.category }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return await tx.token.create({
      data: tokenData
    });
  });
}
```

✅ **Use proper error handling:**
```javascript
async findTokenById(id) {
  try {
    const token = await this.prisma.token.findUnique({
      where: { id },
      include: { tenant: true, project: true }
    });

    if (!token) {
      return null; // Let controller handle 404
    }

    return token;
  } catch (error) {
    throw new Error(`Failed to find token: ${error.message}`);
  }
}
```

✅ **Use select/include for performance:**
```javascript
// Only fetch needed fields
const tokens = await this.prisma.token.findMany({
  where: { tenantId, projectId },
  select: {
    id: true,
    name: true,
    value: true,
    category: true
    // Don't fetch tenantId, projectId, createdAt if not needed
  }
});
```

### 6. Authentication Patterns

**JWT Authentication (Admin Users):**
```javascript
import jwt from 'jsonwebtoken';

export function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

**API Key Authentication (Programmatic Access):**
```javascript
export async function verifyApiKey(req, res, next) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ message: 'API key required' });
  }

  const hashedKey = hashApiKey(apiKey);
  const keyRecord = await databaseService.findApiKeyByHash(hashedKey);

  if (!keyRecord || keyRecord.revoked) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  req.tenant = {
    tenantId: keyRecord.tenantId,
    projectId: keyRecord.projectId
  };
  req.apiKey = keyRecord;
  next();
}
```

### 7. Error Handling

**Centralized error handler:**
```javascript
export function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Resource already exists',
      field: err.meta?.target
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
}
```

**Custom error classes:**
```javascript
export class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}
```

### 8. Response Standards

**Consistent response format:**

✅ **Success (200/201):**
```javascript
res.json({
  token: { id, name, value, category }
});

// Or with pagination
res.json({
  tokens: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    pages: 3
  }
});
```

✅ **Created (201):**
```javascript
res.status(201).json({
  token: newToken,
  message: 'Token created successfully'
});
```

✅ **Error (4xx/5xx):**
```javascript
res.status(404).json({
  message: 'Token not found',
  code: 'RESOURCE_NOT_FOUND'
});
```

### 9. Testing Standards

**Integration tests for endpoints:**
```javascript
import request from 'supertest';
import app from '../src/index.js';
import databaseService from '../src/dal/DatabaseService.js';

describe('POST /api/v1/tokens', () => {
  let authToken;
  let tenantId;
  let projectId;

  beforeAll(async () => {
    // Setup test data
    const tenant = await databaseService.createTenant({ name: 'Test' });
    tenantId = tenant.id;

    const project = await databaseService.createProject({
      name: 'Test Project',
      tenantId
    });
    projectId = project.id;

    // Get JWT token
    authToken = 'test-jwt-token';
  });

  it('should create a token with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', tenantId)
      .set('X-Project-ID', projectId)
      .send({
        name: 'primary-color',
        value: '#007bff',
        category: 'color'
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toHaveProperty('id');
    expect(response.body.token.name).toBe('primary-color');
  });

  it('should enforce tenant isolation', async () => {
    // Attempt to access another tenant's data
    const response = await request(app)
      .get('/api/v1/tokens')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', 'wrong-tenant-id')
      .set('X-Project-ID', projectId);

    expect(response.status).toBe(403); // Or 404 depending on implementation
  });
});
```

## Quick Reference

### Controller Checklist
- [ ] Import `databaseService` from DAL
- [ ] Extract `tenantId, projectId` from `req.tenant`
- [ ] Use try/catch with `next(error)`
- [ ] Return consistent JSON responses
- [ ] Proper HTTP status codes
- [ ] JSDoc comments for routes

### Route Checklist
- [ ] Authentication middleware first
- [ ] Tenant context middleware second
- [ ] Authorization (role check) third
- [ ] Input validation fourth
- [ ] Controller last
- [ ] Swagger documentation

### DAL Checklist
- [ ] All queries include tenant/project filtering
- [ ] Use Prisma transactions for multi-step operations
- [ ] Proper error handling
- [ ] Use select/include for performance
- [ ] Return null for not found (let controller handle 404)

### Testing Checklist
- [ ] Test multi-tenant isolation
- [ ] Test authentication/authorization
- [ ] Test validation errors
- [ ] Test success cases
- [ ] Test error cases (404, 409, etc.)
- [ ] Clean up test data in afterAll

## Common Violations

### ❌ Direct Prisma Access in Controller
```javascript
// WRONG
import prisma from '../config/prisma.js';
const tokens = await prisma.token.findMany();
```

### ❌ Missing Tenant Isolation
```javascript
// WRONG - no tenant/project filtering
const tokens = await databaseService.findAllTokens();
```

### ❌ Wrong Middleware Order
```javascript
// WRONG - authorization before authentication
router.get('/', requireRole(['admin']), verifyJWT, controller);
```

### ❌ Inconsistent Error Handling
```javascript
// WRONG - sending error directly
catch (error) {
  res.status(500).json({ error: error.message });
}
```

---

**Remember:** Multi-tenant isolation is CRITICAL. Every database query must filter by tenant/project. Use the DAL layer. Follow middleware order. Test tenant isolation.
