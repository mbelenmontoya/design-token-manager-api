import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
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
import mongoose from 'mongoose';

// Database Abstraction Layer
import databaseService from './dal/DatabaseService.js';


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
  res.send('Design Token Manager API is running 🚀');
});

app.get('/health', async (_req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  let dalHealth = null;
  
  try {
    // Initialize DAL if not already done
    if (!databaseService.isInitialized) {
      await databaseService.initialize();
    }
    dalHealth = await databaseService.healthCheck();
  } catch (error) {
    dalHealth = {
      status: 'error',
      message: error.message,
      configuration: { reads: 'unknown', writes: 'unknown' }
    };
  }
  
  const isHealthy = mongoConnected && 
                   dalHealth && 
                   dalHealth.read?.status === 'healthy' && 
                   dalHealth.write?.status === 'healthy';
  
  // Always return 200 (endpoint is working), but indicate health status in body
  // This allows tests and monitoring to work even when databases are unavailable
  res.status(200).json({
    ok: isHealthy,
    mongo: { connected: mongoConnected },
    dal: dalHealth
  });
});

// 6) Start server
const start = async () => {
  // In CI environment, MongoDB should be available - try harder to connect
  const isCI = process.env.CI || process.env.NODE_ENV === 'ci';
  let mongoConnected = false;
  
  if (isCI) {
    // In CI, retry MongoDB connection multiple times
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        const conn = await connectDB();
        mongoConnected = true;
        // Wait for connection to be fully ready and test it
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Test the connection with a simple operation
        await mongoose.connection.db.admin().ping();
        console.log(`✅ MongoDB connection verified with ping`);
        // Ensure connection is in connected state
        if (mongoose.connection.readyState !== 1) {
          throw new Error(`Connection not in ready state: ${mongoose.connection.readyState}`);
        }
        break;
      } catch (error) {
        console.error(`❌ MongoDB connection attempt ${attempt}/10 failed:`, error.message);
        if (attempt === 10) {
          console.error('❌ MongoDB connection failed after 10 attempts in CI - this will cause test failures');
          throw error; // Fail startup in CI if we can't connect
        } else {
          console.log(`🔄 Retrying MongoDB connection in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
  } else {
    // In development, try once but don't fail startup
    try {
      await connectDB();
      mongoConnected = true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      console.log('🔄 Server will start anyway, MongoDB connection will be retried');
    }
  }
  
  // Initialize Database Abstraction Layer
  try {
    await databaseService.initialize();
    console.log('✅ Database Abstraction Layer initialized');
  } catch (error) {
    console.error('❌ DAL initialization error:', error.message);
    if (isCI) {
      console.log('❌ DAL initialization failed in CI - this may cause test failures');
    } else {
      console.log('🔄 DAL will be initialized on first health check');
    }
  }
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    if (isCI && !mongoConnected) {
      console.log('⚠️  Server started in CI mode but MongoDB is not connected');
    }
  });
};

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  start();
}

// Export app for testing
export default app;
