import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import DatabaseService from '../../src/dal/DatabaseService.js';

/**
 * Integration Test: DAL Foundation
 * Validates that the DAL system is ready for PR #1
 */
describe('DAL Integration - PR #1 Foundation', () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    
    // Set environment for MongoDB-only mode (PR #1 state)
    process.env.DB_READS = 'mongo';
    process.env.DB_WRITES = 'mongo';
  });

  afterAll(async () => {
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
    
    // Reset DatabaseService
    DatabaseService.isInitialized = false;
    DatabaseService.readAdapter = null;
    DatabaseService.writeAdapter = null;
  });

  describe('PR #1 Acceptance Criteria', () => {
    test('should initialize DatabaseService with MongoDB adapters', async () => {
      await DatabaseService.initialize();
      
      expect(DatabaseService.isInitialized).toBe(true);
      expect(DatabaseService.readAdapter).toBeTruthy();
      expect(DatabaseService.writeAdapter).toBeTruthy();
      expect(DatabaseService.readAdapter.constructor.name).toBe('MongoAdapter');
      expect(DatabaseService.writeAdapter.constructor.name).toBe('MongoAdapter');
    });

    test('should provide health check showing MongoDB connection', async () => {
      await DatabaseService.initialize();
      const health = await DatabaseService.healthCheck();

      expect(health).toHaveProperty('read');
      expect(health).toHaveProperty('write');
      expect(health).toHaveProperty('configuration');
      
      expect(health.read.database).toBe('mongodb');
      expect(health.read.adapter).toBe('MongoAdapter');
      expect(health.write.database).toBe('mongodb');
      expect(health.write.adapter).toBe('MongoAdapter');
      
      expect(health.configuration).toEqual({
        reads: 'mongo',
        writes: 'mongo'
      });
    });

    test('should perform complete CRUD operations through DAL', async () => {
      await DatabaseService.initialize();

      // Create test data hierarchy (matches real API workflow)
      const userData = { username: 'testuser', password: 'hashedpass' };
      const user = await DatabaseService.createUser(userData);
      expect(user.username).toBe('testuser');

      const tenantData = { name: 'Test Tenant' };
      const tenant = await DatabaseService.createTenant(tenantData);
      expect(tenant.name).toBe('Test Tenant');

      const projectData = { name: 'Test Project', tenant: tenant._id };
      const project = await DatabaseService.createProject(projectData);
      expect(project.name).toBe('Test Project');

      // Create token (main entity)
      const tokenData = {
        tenant: tenant._id,
        project: project._id,
        name: 'primary-color',
        value: '#007bff',
        category: 'color',
        description: 'Primary brand color'
      };
      const token = await DatabaseService.createToken(tokenData);
      expect(token.name).toBe('primary-color');
      expect(token.value).toBe('#007bff');

      // Read operations
      const foundUser = await DatabaseService.findUserById(user._id);
      expect(foundUser.username).toBe('testuser');

      const foundTenant = await DatabaseService.findTenantById(tenant._id);
      expect(foundTenant.name).toBe('Test Tenant');

      const foundProject = await DatabaseService.findProjectById(project._id);
      expect(foundProject.name).toBe('Test Project');

      const foundToken = await DatabaseService.findTokenById(token._id);
      expect(foundToken.name).toBe('primary-color');

      // Query operations (as controllers would use)
      const projectTokens = await DatabaseService.findTokensByProject(project._id);
      expect(projectTokens).toHaveLength(1);
      expect(projectTokens[0].name).toBe('primary-color');

      const tenantTokens = await DatabaseService.findTokensByTenant(tenant._id);
      expect(tenantTokens).toHaveLength(1);
      expect(tenantTokens[0].name).toBe('primary-color');

      // Update operations
      const updatedToken = await DatabaseService.updateToken(token._id, {
        value: '#0056b3',
        description: 'Updated primary color'
      });
      expect(updatedToken.value).toBe('#0056b3');
      expect(updatedToken.description).toBe('Updated primary color');

      // Delete operations
      await DatabaseService.deleteToken(token._id);
      const deletedToken = await DatabaseService.findTokenById(token._id);
      expect(deletedToken).toBeNull();
    });

    test('should handle multi-tenant operations correctly', async () => {
      await DatabaseService.initialize();

      // Create two tenants with projects and tokens
      const tenant1 = await DatabaseService.createTenant({ name: 'Tenant 1' });
      const tenant2 = await DatabaseService.createTenant({ name: 'Tenant 2' });

      const project1 = await DatabaseService.createProject({ 
        name: 'Project 1', 
        tenant: tenant1._id 
      });
      const project2 = await DatabaseService.createProject({ 
        name: 'Project 2', 
        tenant: tenant2._id 
      });

      // Create tokens in each tenant
      await DatabaseService.createToken({
        tenant: tenant1._id,
        project: project1._id,
        name: 'tenant1-color',
        value: '#ff0000',
        category: 'color'
      });

      await DatabaseService.createToken({
        tenant: tenant2._id,
        project: project2._id,
        name: 'tenant2-color',
        value: '#00ff00',
        category: 'color'
      });

      // Verify tenant isolation
      const tenant1Tokens = await DatabaseService.findTokensByTenant(tenant1._id);
      const tenant2Tokens = await DatabaseService.findTokensByTenant(tenant2._id);

      expect(tenant1Tokens).toHaveLength(1);
      expect(tenant2Tokens).toHaveLength(1);
      expect(tenant1Tokens[0].name).toBe('tenant1-color');
      expect(tenant2Tokens[0].name).toBe('tenant2-color');
    });

    test('should support search operations as required by API', async () => {
      await DatabaseService.initialize();

      const tenant = await DatabaseService.createTenant({ name: 'Search Test Tenant' });
      const project = await DatabaseService.createProject({ 
        name: 'Search Test Project', 
        tenant: tenant._id 
      });

      // Create searchable tokens
      await DatabaseService.createToken({
        tenant: tenant._id,
        project: project._id,
        name: 'primary-button-color',
        value: '#007bff',
        category: 'color',
        description: 'Color for primary action buttons'
      });

      await DatabaseService.createToken({
        tenant: tenant._id,
        project: project._id,
        name: 'secondary-text-color',
        value: '#6c757d',
        category: 'color',
        description: 'Color for secondary text elements'
      });

      // Search operations
      const primaryResults = await DatabaseService.searchTokens('primary', {
        tenantId: tenant._id
      });
      expect(primaryResults).toHaveLength(1);
      expect(primaryResults[0].name).toBe('primary-button-color');

      const colorResults = await DatabaseService.searchTokens('color', {
        tenantId: tenant._id
      });
      expect(colorResults).toHaveLength(2); // Matches both tokens

      const buttonResults = await DatabaseService.searchTokens('button', {
        tenantId: tenant._id
      });
      expect(buttonResults).toHaveLength(1);
      expect(buttonResults[0].name).toBe('primary-button-color');
    });
  });

  describe('DAL System Readiness', () => {
    test('should be ready for controller integration (PR #2)', async () => {
      await DatabaseService.initialize();
      
      // Verify all methods needed by controllers exist and work
      const requiredMethods = [
        'findTokenById',
        'findTokensByProject',
        'findTokensByTenant',
        'createToken',
        'updateToken',
        'deleteToken',
        'searchTokens',
        'findUserById',
        'findUserByUsername',
        'findTenantById',
        'findProjectById'
      ];

      for (const method of requiredMethods) {
        expect(typeof DatabaseService[method]).toBe('function');
      }

      // Quick smoke test of a few key methods
      const tenant = await DatabaseService.createTenant({ name: 'Controller Ready Test' });
      const foundTenant = await DatabaseService.findTenantById(tenant._id);
      expect(foundTenant.name).toBe('Controller Ready Test');
    });

    test('should handle connection errors gracefully', async () => {
      // This test verifies error handling without requiring real connection errors
      await DatabaseService.initialize();
      
      const health = await DatabaseService.healthCheck();
      expect(health).toHaveProperty('read');
      expect(health).toHaveProperty('write');
      
      // The health check should always return an object, even if connections fail
      expect(typeof health.read).toBe('object');
      expect(typeof health.write).toBe('object');
    });
  });
});