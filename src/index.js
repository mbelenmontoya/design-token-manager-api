import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import tokenRoutes from './routes/tokens.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import categoryRoutes from './routes/categories.js';
import invitationRoutes from './routes/invitations.js';
import membershipRoutes from './routes/memberships.js';
import versioning from './middleware/versioning.js';
import statusRoutes from './routes/status.js';
import releaseRoutes from './routes/releases.js';
import apiKeyRoutes from './routes/apiKeys.js';
import userRoutes from './routes/users.js';
import billingRoutes from './routes/billing.js';
import webhooksRoutes from './routes/webhooks.js';
import projectsRoutes from './routes/projects.js';

// Database Abstraction Layer
import databaseService from './dal/DatabaseService.js';


dotenv.config();
const app = express();

// 1) CORS: allow your React app origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Authorization','Content-Type','x-tenant-id','x-project-id'],
}));

// 2) Logging: show incoming requests in your console
app.use(morgan('dev'));

// 3) JSON parser
app.use(express.json());  // parse JSON bodies

// Versioning headers
app.use(versioning);

const swaggerSpecV1 = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Design Token Manager API',
      version: '1.0.0',
      description: 'Multi-tenant design token API with JWT and API key auth',
    },
    servers: [
      { url: 'http://localhost:4000/api/v1', description: 'v1' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin JWT'
        },
        apiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'APIKey',
          description: 'Project API key'
        }
      },
      parameters: {
        XTenantId: {
          name: 'x-tenant-id',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          description: 'Tenant ID (required for scoped operations)'
        },
        XProjectId: {
          name: 'x-project-id',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID (required for scoped operations)'
        }
      },
      schemas: {
        BillingSummary: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['stripe', 'mercadopago'] },
            tenantId: { type: 'string' },
            plan: { type: 'string' },
            status: { type: 'string' },
            currency: { type: 'string' },
            amount: { type: 'number' },
            interval: { type: 'string', enum: ['month', 'year'] },
            currentPeriodEnd: { type: 'string', format: 'date-time' },
            seats: {
              type: 'object',
              properties: {
                used: { type: 'integer' },
                limit: { type: 'integer' }
              }
            },
            usage: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        BillingPortalResponse: {
          type: 'object',
          properties: { url: { type: 'string', format: 'uri' } }
        },
        Token: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            tenantId: { type: 'string' },
            projectId: { type: 'string' },
            name: { type: 'string' },
            value: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TokenInput: {
          type: 'object',
          required: ['name', 'value'],
          properties: {
            name: { type: 'string' },
            value: { type: 'string' },
            category: {
              type: 'string',
              enum: ['color', 'spacing', 'font', 'shadow', 'other'],
            },
            description: { type: 'string' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            tenantId: { type: 'string' },
            projectId: { type: 'string' },
            scopes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['read:tokens', 'write:tokens']
              }
            },
            createdById: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKeyRequest: {
          type: 'object',
          required: ['scopes'],
          properties: {
            scopes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['read:tokens', 'write:tokens']
              }
            },
          },
        },
        ApiKeyWithValue: {
          type: 'object',
          properties: {
            apiKey: { type: 'string' },
            id: { type: 'string' },
          },
        },
        ApiKeyRotateResponse: {
          type: 'object',
          properties: {
            apiKey: { type: 'string' },
          },
        },
        MembershipItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' }
              }
            },
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
    },
  },
  // 2) Point to where your JSDoc comments live
  apis: ['./src/routes/*.js'],
});

// 4) Routes
app.use('/', releaseRoutes);
app.use('/api/v1/tokens', tokenRoutes);
// Backwards compatibility for unversioned path
app.use('/api/tokens', tokenRoutes);
app.use('/api/v1/auth', authRoutes);
// Backwards compatibility for auth login
app.use('/api/auth', authRoutes);
app.use('/status', statusRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1', invitationRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
// Backwards compatibility for API key routes
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/billing', billingRoutes);
// Webhooks (no auth)
app.use('/webhooks', webhooksRoutes);
app.use('/api/v1', projectsRoutes);
app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(swaggerSpecV1));



// 5) Health‐check
app.get('/', (req, res) => {
  res.send('Design Token Manager API is running 🚀');
});

// 6) Start server
const start = async () => {
  // Initialize Database Abstraction Layer
  try {
    await databaseService.initialize();
    console.log('✅ Database Abstraction Layer initialized');
  } catch (error) {
    console.error('❌ DAL initialization error:', error.message);
  }
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
};

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  start();
}

// Export app for testing
export default app;
