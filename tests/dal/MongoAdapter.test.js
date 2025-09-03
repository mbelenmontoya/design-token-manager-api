import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoAdapter } from '../../src/dal/adapters/MongoAdapter.js';

describe('MongoAdapter', () => {
  let adapter;
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    adapter = new MongoAdapter();
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
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      await expect(adapter.connect()).resolves.not.toThrow();
    });

    test('should provide health check', async () => {
      await adapter.connect();
      const health = await adapter.healthCheck();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('connection');
      expect(health).toHaveProperty('database', 'mongodb');
      expect(health).toHaveProperty('adapter', 'MongoAdapter');
    });
  });

  describe('User Operations', () => {
    test('should create and find user', async () => {
      await adapter.connect();
      
      const userData = {
        username: 'testuser',
        password: 'hashedpassword123'
      };

      const createdUser = await adapter.createUser(userData);
      expect(createdUser).toHaveProperty('_id');
      expect(createdUser.username).toBe(userData.username);

      const foundUser = await adapter.findUserById(createdUser._id);
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe(userData.username);
    });

    test('should find user by username', async () => {
      await adapter.connect();
      
      const userData = {
        username: 'testuser2',
        password: 'hashedpassword123'
      };

      await adapter.createUser(userData);
      const foundUser = await adapter.findUserByUsername('testuser2');
      
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('testuser2');
    });

    test('should update user', async () => {
      await adapter.connect();
      
      const userData = {
        username: 'testuser3',
        password: 'hashedpassword123'
      };

      const createdUser = await adapter.createUser(userData);
      const updatedUser = await adapter.updateUser(createdUser._id, { username: 'updateduser' });
      
      expect(updatedUser.username).toBe('updateduser');
    });

    test('should delete user', async () => {
      await adapter.connect();
      
      const userData = {
        username: 'testuser4',
        password: 'hashedpassword123'
      };

      const createdUser = await adapter.createUser(userData);
      await adapter.deleteUser(createdUser._id);
      
      const foundUser = await adapter.findUserById(createdUser._id);
      expect(foundUser).toBeNull();
    });
  });

  describe('Tenant Operations', () => {
    test('should create and find tenant', async () => {
      await adapter.connect();
      
      const tenantData = { name: 'Test Tenant' };
      const createdTenant = await adapter.createTenant(tenantData);
      
      expect(createdTenant).toHaveProperty('_id');
      expect(createdTenant.name).toBe(tenantData.name);

      const foundTenant = await adapter.findTenantById(createdTenant._id);
      expect(foundTenant.name).toBe(tenantData.name);
    });

    test('should find tenant by name', async () => {
      await adapter.connect();
      
      const tenantData = { name: 'Unique Tenant Name' };
      await adapter.createTenant(tenantData);
      
      const foundTenant = await adapter.findTenantByName('Unique Tenant Name');
      expect(foundTenant).toBeTruthy();
      expect(foundTenant.name).toBe('Unique Tenant Name');
    });
  });

  describe('Project Operations', () => {
    let testTenant;

    beforeEach(async () => {
      await adapter.connect();
      testTenant = await adapter.createTenant({ name: 'Test Tenant for Projects' });
    });

    test('should create and find project', async () => {
      const projectData = {
        name: 'Test Project',
        tenant: testTenant._id
      };

      const createdProject = await adapter.createProject(projectData);
      expect(createdProject).toHaveProperty('_id');
      expect(createdProject.name).toBe(projectData.name);

      const foundProject = await adapter.findProjectById(createdProject._id);
      expect(foundProject.name).toBe(projectData.name);
    });

    test('should find projects by tenant', async () => {
      const projectData1 = { name: 'Project 1', tenant: testTenant._id };
      const projectData2 = { name: 'Project 2', tenant: testTenant._id };

      await adapter.createProject(projectData1);
      await adapter.createProject(projectData2);

      const projects = await adapter.findProjectsByTenant(testTenant._id);
      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.name)).toContain('Project 1');
      expect(projects.map(p => p.name)).toContain('Project 2');
    });
  });

  describe('Token Operations', () => {
    let testTenant, testProject;

    beforeEach(async () => {
      await adapter.connect();
      testTenant = await adapter.createTenant({ name: 'Test Tenant for Tokens' });
      testProject = await adapter.createProject({
        name: 'Test Project for Tokens',
        tenant: testTenant._id
      });
    });

    test('should create and find token', async () => {
      const tokenData = {
        tenant: testTenant._id,
        project: testProject._id,
        name: 'primary-color',
        value: '#007bff',
        category: 'color',
        description: 'Primary brand color'
      };

      const createdToken = await adapter.createToken(tokenData);
      expect(createdToken).toHaveProperty('_id');
      expect(createdToken.name).toBe(tokenData.name);
      expect(createdToken.value).toBe(tokenData.value);

      const foundToken = await adapter.findTokenById(createdToken._id);
      expect(foundToken.name).toBe(tokenData.name);
      expect(foundToken.value).toBe(tokenData.value);
    });

    test('should find tokens by project', async () => {
      const tokenData1 = {
        tenant: testTenant._id,
        project: testProject._id,
        name: 'primary-color',
        value: '#007bff',
        category: 'color'
      };
      
      const tokenData2 = {
        tenant: testTenant._id,
        project: testProject._id,
        name: 'secondary-color',
        value: '#6c757d',
        category: 'color'
      };

      await adapter.createToken(tokenData1);
      await adapter.createToken(tokenData2);

      const tokens = await adapter.findTokensByProject(testProject._id);
      expect(tokens).toHaveLength(2);
      expect(tokens.map(t => t.name)).toContain('primary-color');
      expect(tokens.map(t => t.name)).toContain('secondary-color');
    });

    test('should search tokens with query', async () => {
      const tokenData = {
        tenant: testTenant._id,
        project: testProject._id,
        name: 'primary-button-color',
        value: '#007bff',
        category: 'color',
        description: 'Color for primary buttons'
      };

      await adapter.createToken(tokenData);

      const searchResults = await adapter.searchTokens('primary', {
        tenantId: testTenant._id
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('primary-button-color');
    });

    test('should find tokens by project with category filter', async () => {
      const colorToken = {
        tenant: testTenant._id,
        project: testProject._id,
        name: 'primary-color',
        value: '#007bff',
        category: 'color'
      };
      
      const spacingToken = {
        tenant: testTenant._id,
        project: testProject._id,
        name: 'base-spacing',
        value: '16px',
        category: 'spacing'
      };

      await adapter.createToken(colorToken);
      await adapter.createToken(spacingToken);

      const colorTokens = await adapter.findTokensByProject(testProject._id, {
        category: 'color'
      });

      expect(colorTokens).toHaveLength(1);
      expect(colorTokens[0].category).toBe('color');
    });
  });

  describe('Category Operations', () => {
    test('should create and find all categories', async () => {
      await adapter.connect();
      
      await adapter.createCategory({ name: 'color' });
      await adapter.createCategory({ name: 'spacing' });
      await adapter.createCategory({ name: 'typography' });

      const categories = await adapter.findAllCategories();
      expect(categories).toHaveLength(3);
      expect(categories.map(c => c.name)).toContain('color');
      expect(categories.map(c => c.name)).toContain('spacing');
      expect(categories.map(c => c.name)).toContain('typography');
    });

    test('should find category by name', async () => {
      await adapter.connect();
      
      await adapter.createCategory({ name: 'shadow' });
      const category = await adapter.findCategoryByName('shadow');
      
      expect(category).toBeTruthy();
      expect(category.name).toBe('shadow');
    });
  });

  describe('Transaction Operations', () => {
    test('should handle transaction methods gracefully', async () => {
      await adapter.connect();
      
      const transaction = await adapter.beginTransaction();
      expect(transaction).toBeNull(); // MongoDB adapter returns null for basic operations
      
      const commitResult = await adapter.commitTransaction();
      expect(commitResult).toBe(true);
      
      const rollbackResult = await adapter.rollbackTransaction();
      expect(rollbackResult).toBe(true);
    });
  });
});