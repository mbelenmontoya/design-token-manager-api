# Design Token Manager API - Technical Specification

Note: Current runtime is Supabase/PostgreSQL via Prisma behind a Database Abstraction Layer (DAL). MongoDB and Mongoose content in this document remains for historical context and will be progressively refactored. See docs/ROADMAP.md for the up-to-date plan and docs/TESTING_LOCAL_SUPABASE.md for local setup.

## System Architecture

### High-Level Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│              Design Token Manager API                       │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express + Middleware Stack                      │
│  + Swagger (OpenAPI), JWT + API Key                        │
│  + Database Abstraction Layer (DAL)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma Client
                              │
┌─────────────────────────────────────────────────────────────┐
│                Supabase / PostgreSQL (Prisma)              │
├─────────────────────────────────────────────────────────────┤
│  Multi-tenant schema: Users • Tenants • Projects • Tokens  │
│  API Keys • Memberships • Invitations • Categories         │
└─────────────────────────────────────────────────────────────┘
```

### High-Level Architecture (Legacy Mongo — Historical)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Web Dashboard│ │ Mobile App  │ │ CLI Tools   │          │
│  │ (React)     │ │ (React      │ │ (Node.js)   │          │
│  │             │ │  Native)    │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│              Design Token Manager API                       │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express + Middleware Stack                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Auth        │ │ Controllers │ │ Middleware  │          │
│  │ Layer       │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Mongoose ODM
                              │
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                            │
├─────────────────────────────────────────────────────────────┤
│  Multi-tenant Data Storage with Collections:               │
│  • Users • Tenants • Projects • Tokens • API Keys         │
│  • Memberships • Invitations • Categories                  │
└─────────────────────────────────────────────────────────────┘
```

### Application Layer Structure

```
src/
├── index.js                 # Application entry point
├── config/                  # Configuration files
│   ├── db.js               # Database connection
│   └── versioning.js       # API versioning config
├── controllers/            # Business logic controllers
│   ├── tokenController.js  # Token CRUD operations
│   ├── authController.js   # Authentication logic
│   ├── apiKeyController.js # API key management
│   └── ...                # Additional controllers
├── middleware/             # Express middleware
│   ├── verifyJWT.js       # JWT authentication
│   ├── verifyApiKey.js    # API key authentication
│   ├── tenantContext.js   # Multi-tenant context
│   ├── requireRole.js     # Role-based access control
│   └── errorHandler.js    # Centralized error handling
├── models/                # Mongoose data models
│   ├── User.js            # User schema
│   ├── Token.js           # Token schema
│   ├── Tenant.js          # Tenant/organization schema
│   └── ...               # Additional models
├── routes/                # Express route definitions
│   ├── tokens.js          # Token management routes
│   ├── auth.js            # Authentication routes
│   └── ...               # Additional routes
└── scripts/               # Utility scripts
    ├── seedUser.js        # Initial user creation
    └── seedCategories.js  # Default categories
```

## Technology Stack Deep Dive

### Backend Technologies

#### Core Framework
- **Node.js 18.x**: LTS version with ES modules support
  - Native ES6+ features (async/await, destructuring, modules)
  - Event-driven, non-blocking I/O for high performance
  - V8 JavaScript engine optimizations
  - Built-in support for modern web standards

#### Web Framework
- **Express 5.1.0**: Fast, unopinionated web framework
  - Middleware-based architecture
  - Robust routing system
  - Built-in security features
  - Extensive ecosystem of plugins

#### Database Layer
- **MongoDB Atlas**: Cloud-hosted NoSQL database
  - Document-based data storage
  - Horizontal scaling capabilities
  - Built-in replication and backup
  - Global cluster deployment

- **Mongoose 8.14.1**: MongoDB object modeling
  - Schema-based solution for application data
  - Built-in type casting and validation
  - Query building and middleware support
  - Connection pooling and optimization

#### Authentication & Security
- **jsonwebtoken 9.0.2**: JWT token implementation
  - Stateless authentication
  - Configurable expiration
  - Digital signature verification
  - Cross-platform compatibility

- **bcryptjs 3.0.2**: Password hashing
  - Adaptive hashing function
  - Salt generation and verification
  - Configurable work factor
  - Timing attack resistance

### API Documentation & Testing

#### Documentation
- **swagger-jsdoc 6.2.8**: OpenAPI specification generation
  - JSDoc comment-based documentation
  - Automatic schema generation
  - Version management support
  - Integration with Express routes

- **swagger-ui-express 5.0.1**: Interactive API documentation
  - Browser-based API explorer
  - Request/response testing
  - Authentication integration
  - Customizable UI themes

#### Testing Framework
- **Jest 29.7.0**: JavaScript testing framework
  - Built-in test runner and assertion library
  - Mocking and spying capabilities
  - Code coverage reporting
  - Parallel test execution

- **Supertest 7.1.0**: HTTP testing library
  - Integration testing for Express applications
  - Request/response assertion methods
  - Authentication testing support
  - Async/await compatibility

- **MongoDB Memory Server 10.1.4**: In-memory MongoDB
  - Isolated test database instances
  - No external database dependencies
  - Fast test execution
  - Automatic cleanup

### Development Tools

#### Code Quality
- **ESLint 9.26.0**: JavaScript linting
  - Code quality enforcement
  - Style consistency checking
  - Error and bug detection
  - Configurable rule sets

#### Development Server
- **nodemon 3.1.10**: Development file watcher
  - Automatic server restart on file changes
  - Configurable watch patterns
  - Environment variable support
  - Custom restart commands

#### Validation & Sanitization
- **express-validator 7.2.1**: Input validation middleware
  - Request data validation
  - Sanitization and normalization
  - Custom validation rules
  - Error message customization

## Database Design & Schema

### Multi-Tenant Data Model

#### Entity Relationship Diagram
```
Users
├── _id (ObjectId, Primary Key)
├── username (String, Unique)
├── password (String, Hashed)
└── timestamps (createdAt, updatedAt)

Tenants (Organizations)
├── _id (ObjectId, Primary Key)
├── name (String, Unique)
└── timestamps (createdAt, updatedAt)

Projects
├── _id (ObjectId, Primary Key)
├── tenant (ObjectId, Foreign Key → Tenants)
├── name (String)
└── timestamps (createdAt, updatedAt)

Tokens
├── _id (ObjectId, Primary Key)
├── tenant (ObjectId, Foreign Key → Tenants)
├── project (ObjectId, Foreign Key → Projects)
├── name (String, Unique per project)
├── value (String)
├── category (String)
├── description (String)
└── timestamps (createdAt, updatedAt)

Memberships
├── _id (ObjectId, Primary Key)
├── user (ObjectId, Foreign Key → Users)
├── tenant (ObjectId, Foreign Key → Tenants)
├── role (String: admin|editor|viewer)
└── timestamps (createdAt, updatedAt)

ApiKeys
├── _id (ObjectId, Primary Key)
├── tenant (ObjectId, Foreign Key → Tenants)
├── project (ObjectId, Foreign Key → Projects)
├── keyHash (String, Hashed)
├── scopes (Array[String])
├── createdBy (ObjectId, Foreign Key → Users)
└── timestamps (createdAt, updatedAt)
```

### Schema Definitions

#### User Schema
```javascript
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  }
}, { 
  timestamps: true 
});

// Indexes
userSchema.index({ username: 1 }, { unique: true });

// Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Methods
userSchema.methods.matchPassword = function(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};
```

#### Token Schema
```javascript
const tokenSchema = new mongoose.Schema({
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true 
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    default: 'other',
    enum: ['color', 'spacing', 'font', 'shadow', 'other']
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  }
}, { 
  timestamps: true 
});

// Indexes
tokenSchema.index({ tenant: 1, project: 1, name: 1 }, { unique: true });
tokenSchema.index({ tenant: 1, project: 1, category: 1 });
tokenSchema.index({ tenant: 1, project: 1, createdAt: -1 });
```

#### API Key Schema
```javascript
const apiKeySchema = new mongoose.Schema({
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true 
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  keyHash: { 
    type: String, 
    required: true 
  },
  scopes: [{
    type: String,
    enum: ['read:tokens', 'write:tokens']
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Indexes
apiKeySchema.index({ keyHash: 1 }, { unique: true });
apiKeySchema.index({ tenant: 1, project: 1 });
```

### Database Optimization

#### Indexing Strategy
- **Primary Indexes**: Automatic _id indexes on all collections
- **Unique Indexes**: Username, tenant name, token name per project
- **Compound Indexes**: Multi-field queries (tenant + project + category)
- **Sparse Indexes**: Optional fields with performance requirements

#### Query Optimization
```javascript
// Efficient token listing with pagination
const tokens = await Token.find({ 
  tenant: tenantId, 
  project: projectId 
})
  .select('name value category description createdAt')
  .sort({ name: 1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean(); // Returns plain JavaScript objects for better performance

// Aggregation for complex queries
const tokenStats = await Token.aggregate([
  { $match: { tenant: tenantId, project: projectId } },
  { $group: { 
    _id: '$category', 
    count: { $sum: 1 },
    lastUpdated: { $max: '$updatedAt' }
  }},
  { $sort: { count: -1 } }
]);
```

## Authentication & Authorization

### JWT Authentication Flow

#### Token Generation
```javascript
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: 'design-token-manager-api',
      audience: 'design-token-manager'
    }
  );
};
```

#### Token Verification Middleware
```javascript
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: { 
        code: 'MISSING_TOKEN',
        message: 'No token provided' 
      }
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      error: { 
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token' 
      }
    });
  }
};
```

### API Key Authentication

#### API Key Generation
```javascript
const generateApiKey = () => {
  const prefix = 'dtm_ak_'; // Design Token Manager API Key
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
};

const hashApiKey = (key) => {
  return bcrypt.hash(key, 10);
};
```

#### API Key Verification Middleware
```javascript
const verifyApiKey = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer dtm_ak_')) {
    return next(); // Allow JWT verification to handle
  }
  
  const apiKey = authHeader.split(' ')[1];
  
  try {
    // Find API key in database (keys are hashed)
    const keyRecord = await ApiKey.findOne({
      tenant: req.tenantId,
      project: req.projectId
    });
    
    if (!keyRecord || !await bcrypt.compare(apiKey, keyRecord.keyHash)) {
      return res.status(403).json({ 
        error: { 
          code: 'INVALID_API_KEY',
          message: 'Invalid API key' 
        }
      });
    }
    
    req.apiKey = keyRecord;
    req.scopes = keyRecord.scopes;
    next();
  } catch (err) {
    return res.status(500).json({ 
      error: { 
        code: 'AUTH_ERROR',
        message: 'Authentication error' 
      }
    });
  }
};
```

### Role-Based Access Control

#### Role Definitions
```javascript
const ROLES = {
  ADMIN: 'admin',     // Full access to tenant resources
  EDITOR: 'editor',   // Token CRUD, limited admin functions
  VIEWER: 'viewer'    // Read-only access
};

const PERMISSIONS = {
  'admin': [
    'read:tokens', 'write:tokens', 'delete:tokens',
    'read:users', 'write:users', 'delete:users',
    'read:projects', 'write:projects', 'delete:projects',
    'read:api-keys', 'write:api-keys', 'delete:api-keys'
  ],
  'editor': [
    'read:tokens', 'write:tokens', 'delete:tokens',
    'read:projects'
  ],
  'viewer': [
    'read:tokens', 'read:projects'
  ]
};
```

#### Permission Middleware
```javascript
const requireRole = (minRole) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required' 
        }
      });
    }
    
    // Get user's membership for current tenant
    const membership = await Membership.findOne({
      user: req.user.id,
      tenant: req.tenantId
    });
    
    if (!membership) {
      return res.status(403).json({ 
        error: { 
          code: 'ACCESS_DENIED',
          message: 'No access to this tenant' 
        }
      });
    }
    
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    
    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      return res.status(403).json({ 
        error: { 
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Requires ${minRole} role` 
        }
      });
    }
    
    req.userRole = membership.role;
    next();
  };
};
```

## API Design & Implementation

### RESTful API Conventions

#### URL Structure
```
/api/v{version}/{resource}[/{id}][/{sub-resource}]

Examples:
GET    /api/v1/tokens                    # List tokens
POST   /api/v1/tokens                    # Create token
GET    /api/v1/tokens/{id}               # Get specific token
PUT    /api/v1/tokens/{id}               # Update token
DELETE /api/v1/tokens/{id}               # Delete token
POST   /api/v1/tokens/import             # Bulk import
```

#### HTTP Methods & Status Codes
- **GET**: Retrieve resources (200 OK, 404 Not Found)
- **POST**: Create resources (201 Created, 400 Bad Request)
- **PUT**: Update resources (200 OK, 404 Not Found)
- **DELETE**: Remove resources (204 No Content, 404 Not Found)
- **PATCH**: Partial updates (200 OK, 400 Bad Request)

#### Request/Response Format
```javascript
// Request Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt-token>",
  "X-Tenant-ID": "<tenant-id>",
  "X-Project-ID": "<project-id>"
}

// Success Response
{
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}

// Error Response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Token name is required",
    "details": {
      "field": "name",
      "constraint": "required"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Controller Implementation Patterns

#### Token Controller Example
```javascript
export const getTokens = async (req, res, next) => {
  try {
    // 1. Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const category = req.query.category;
    const search = req.query.search;
    
    // 2. Build database filter
    const filter = { 
      tenant: req.tenantId, 
      project: req.projectId 
    };
    
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 3. Execute database queries
    const [tokens, total] = await Promise.all([
      Token.find(filter)
        .select('name value category description createdAt updatedAt')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Token.countDocuments(filter)
    ]);
    
    // 4. Calculate pagination metadata
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;
    
    // 5. Return structured response
    res.json({
      data: {
        tokens,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext,
          hasPrev
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};
```

### Input Validation & Sanitization

#### Validation Middleware
```javascript
import { body, param, query, validationResult } from 'express-validator';

// Token creation validation
export const validateTokenCreation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Token name must be 1-100 characters'),
    
  body('value')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Token value must be 1-500 characters'),
    
  body('category')
    .optional()
    .isIn(['color', 'spacing', 'font', 'shadow', 'other'])
    .withMessage('Invalid category'),
    
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }
    next();
  }
];
```

### Error Handling

#### Centralized Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { statusCode: 401, message };
  }

  res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Server Error'
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
};

export default errorHandler;
```

## Testing Strategy & Implementation

### Test Structure

#### Test Organization
```
tests/
├── unit/                    # Unit tests
│   ├── models/             # Model validation tests
│   │   ├── User.test.js
│   │   └── Token.test.js
│   ├── controllers/        # Controller logic tests
│   │   ├── tokenController.test.js
│   │   └── authController.test.js
│   └── middleware/         # Middleware tests
│       ├── verifyJWT.test.js
│       └── requireRole.test.js
├── integration/            # Integration tests
│   ├── endpoints/          # API endpoint tests
│   │   ├── tokens.test.js
│   │   ├── auth.test.js
│   │   └── apiKeys.test.js
│   └── database/          # Database integration tests
├── helpers/               # Test utilities
│   ├── factories.js       # Test data factories
│   ├── httpClient.js      # HTTP test client
│   └── testDb.js         # Test database setup
├── setup/                 # Test configuration
│   ├── globalSetup.js     # Global test setup
│   ├── globalTeardown.js  # Global test cleanup
│   └── testEnv.js        # Test environment config
└── jest.config.js         # Jest configuration
```

#### Test Factories
```javascript
// helpers/factories.js
import { faker } from '@faker-js/faker';
import User from '../../src/models/User.js';
import Tenant from '../../src/models/Tenant.js';
import Token from '../../src/models/Token.js';

export const createUser = async (overrides = {}) => {
  const userData = {
    username: faker.internet.userName(),
    password: 'TestPassword123!',
    ...overrides
  };
  
  return await User.create(userData);
};

export const createTenant = async (overrides = {}) => {
  const tenantData = {
    name: faker.company.name(),
    ...overrides
  };
  
  return await Tenant.create(tenantData);
};

export const createToken = async (tenant, project, overrides = {}) => {
  const tokenData = {
    tenant: tenant._id,
    project: project._id,
    name: faker.lorem.word(),
    value: faker.color.rgb(),
    category: 'color',
    description: faker.lorem.sentence(),
    ...overrides
  };
  
  return await Token.create(tokenData);
};
```

#### Integration Test Example
```javascript
// integration/endpoints/tokens.test.js
import request from 'supertest';
import app from '../../src/index.js';
import { createUser, createTenant, createProject, createToken } from '../helpers/factories.js';
import { generateToken } from '../helpers/auth.js';

describe('Token Endpoints', () => {
  let user, tenant, project, authToken;
  
  beforeEach(async () => {
    user = await createUser();
    tenant = await createTenant();
    project = await createProject(tenant);
    authToken = generateToken(user);
  });
  
  describe('GET /api/v1/tokens', () => {
    it('should return paginated tokens', async () => {
      // Create test tokens
      await createToken(tenant, project, { name: 'primary-blue' });
      await createToken(tenant, project, { name: 'secondary-red' });
      
      const response = await request(app)
        .get('/api/v1/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant._id.toString())
        .set('X-Project-ID', project._id.toString())
        .query({ page: 1, limit: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });
    
    it('should filter tokens by category', async () => {
      await createToken(tenant, project, { category: 'color' });
      await createToken(tenant, project, { category: 'spacing' });
      
      const response = await request(app)
        .get('/api/v1/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant._id.toString())
        .set('X-Project-ID', project._id.toString())
        .query({ category: 'color' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toHaveLength(1);
      expect(response.body.data.tokens[0].category).toBe('color');
    });
  });
  
  describe('POST /api/v1/tokens', () => {
    it('should create a new token', async () => {
      const tokenData = {
        name: 'test-token',
        value: '#ff0000',
        category: 'color',
        description: 'Test color token'
      };
      
      const response = await request(app)
        .post('/api/v1/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant._id.toString())
        .set('X-Project-ID', project._id.toString())
        .send(tokenData);
      
      expect(response.status).toBe(201);
      expect(response.body.data.token.name).toBe(tokenData.name);
      expect(response.body.data.token.value).toBe(tokenData.value);
    });
    
    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        value: '#ff0000'
      };
      
      const response = await request(app)
        .post('/api/v1/tokens')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant._id.toString())
        .set('X-Project-ID', project._id.toString())
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### Performance Testing

#### Load Testing Setup
```javascript
// performance/loadTest.js
import autocannon from 'autocannon';

const loadTest = async () => {
  const result = await autocannon({
    url: 'http://localhost:4000/api/v1/tokens',
    connections: 10,
    duration: 30,
    headers: {
      'Authorization': 'Bearer <test-token>',
      'X-Tenant-ID': '<test-tenant-id>',
      'X-Project-ID': '<test-project-id>'
    }
  });
  
  console.log('Load test results:', result);
};
```

## Deployment & Operations

### Environment Configuration

#### Production Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGO_OPTIONS=retryWrites=true&w=majority

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-min-256-bits
JWT_EXPIRES_IN=1h

# CORS Configuration
CLIENT_URL=https://your-frontend-domain.com

# API Configuration
API_VERSION=1.0.0
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Security Configuration
BCRYPT_ROUNDS=12
API_KEY_LENGTH=64
```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["node", "src/index.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped
    
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Monitoring & Observability

#### Health Check Endpoints
```javascript
// Health check implementation
app.get('/health', async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: 'unknown',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
  
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    checks.mongodb = dbState === 1 ? 'connected' : 'disconnected';
    
    if (dbState !== 1) {
      return res.status(503).json({ status: 'error', checks });
    }
    
    res.json({ status: 'ok', checks });
  } catch (error) {
    checks.mongodb = 'error';
    res.status(503).json({ status: 'error', checks, error: error.message });
  }
});
```

#### Application Metrics
```javascript
// metrics/collector.js
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeConnections: 0
    };
  }
  
  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }
  
  recordError() {
    this.metrics.errors++;
  }
  
  getMetrics() {
    const responseTimes = this.metrics.responseTime;
    return {
      ...this.metrics,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      errorRate: this.metrics.errors / this.metrics.requests
    };
  }
}
```

---

*This technical specification serves as a comprehensive reference for developers and system administrators working with the Design Token Manager API. It should be updated as the system evolves and new technologies are adopted.*
