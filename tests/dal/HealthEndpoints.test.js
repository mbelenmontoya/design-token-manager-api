import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../src/index.js';

/**
 * Health Endpoints Test
 * Validates that the updated health and status endpoints include DAL information
 */
describe('Health Endpoints with DAL', () => {
  let server;
  let agent;
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.JWT_SECRET = 'testsecret';
    process.env.DB_READS = 'mongo';
    process.env.DB_WRITES = 'mongo';
    
    await mongoose.connect(uri);
    server = http.createServer(app);
    agent = request.agent(server);
  });

  afterAll(async () => {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  });

  describe('GET /health', () => {
    test('should return health status including DAL information', async () => {
      const response = await agent.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('mongo');
      expect(response.body).toHaveProperty('dal');
      
      // MongoDB connection
      expect(response.body.mongo).toHaveProperty('connected', true);
      
      // DAL information
      expect(response.body.dal).toHaveProperty('read');
      expect(response.body.dal).toHaveProperty('write');
      expect(response.body.dal).toHaveProperty('configuration');
      
      expect(response.body.dal.configuration).toEqual({
        reads: 'mongo',
        writes: 'mongo'
      });
      
      expect(response.body.dal.read.database).toBe('mongodb');
      expect(response.body.dal.read.adapter).toBe('MongoAdapter');
      expect(response.body.dal.write.database).toBe('mongodb');
      expect(response.body.dal.write.adapter).toBe('MongoAdapter');
    });
  });

  describe('GET /status/database', () => {
    test('should return detailed DAL status information', async () => {
      const response = await agent.get('/status/database');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('initialized', true);
      expect(response.body).toHaveProperty('configuration');
      expect(response.body).toHaveProperty('health');
      expect(response.body).toHaveProperty('migration');
      
      // Configuration
      expect(response.body.configuration).toEqual({
        reads: 'mongo',
        writes: 'mongo'
      });
      
      // Health details
      expect(response.body.health.read.database).toBe('mongodb');
      expect(response.body.health.read.adapter).toBe('MongoAdapter');
      expect(response.body.health.write.database).toBe('mongodb');
      expect(response.body.health.write.adapter).toBe('MongoAdapter');
      
      // Migration status
      expect(response.body.migration.status).toBe('PR #1 - DAL Foundation Complete');
      expect(response.body.migration.phase).toBe('MongoDB Adapter Ready');
      expect(response.body.migration.nextPhase).toBe('Controller Migration (PR #2)');
    });
  });

  describe('GET /status/versioning', () => {
    test('should still work as before', async () => {
      const response = await agent.get('/status/versioning');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentVersion');
      expect(response.body).toHaveProperty('supportedVersions');
      expect(response.body).toHaveProperty('policy');
    });
  });
});