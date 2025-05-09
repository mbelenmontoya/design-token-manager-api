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

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Design Token Manager API',
      version: '1.0.0',
      description: 'CRUD for design tokens, with JWT auth',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local server' }
    ],
    components: {
      schemas: {
        Token: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
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
              enum: ['color', 'spacing', 'font', 'shadow', 'other']
            },
            description: { type: 'string' },
          },
        },
      },
    },
  },
  // 2) Point to where your JSDoc comments live
  apis: ['./src/routes/*.js'],
});

// 4) Routes
app.use('/api/tokens', tokenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// 5) Health‐check
app.get('/', (req, res) => {
  res.send('Design Token Manager API is running 🚀');
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
