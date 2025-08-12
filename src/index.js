import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
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
import pkg from '../package.json' with { type: 'json' };


dotenv.config();
const app = express();

// 1) CORS: allow your React app origin
app.use(cors({
  origin: process.env.CLIENT_URL, // your Vite dev server
  credentials: true,
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
      description: 'CRUD for design tokens, with JWT auth',
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
      schemas: {
        Token: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tenant: { type: 'string' },
            project: { type: 'string' },
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
            _id: { type: 'string' },
            tenant: { type: 'string' },
            project: { type: 'string' },
            scopes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['read:tokens', 'write:tokens']
              }
            },
            createdBy: { type: 'string' },
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
app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(swaggerSpecV1));



// 5) Health‐check
app.get('/', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  const payload = {
    ok: connected,
    uptime: Math.round(process.uptime()),
    version: pkg.version,
    mongo: { connected }
  };
  if (connected) {
    payload.mongo.host = mongoose.connection.host;
    payload.mongo.db = mongoose.connection.name;
  } else {
    payload.reason = 'MongoDB not connected';
  }
  res.status(connected ? 200 : 500).json(payload);
});

// 6) Start server
const start = async () => {
  await connectDB();
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
