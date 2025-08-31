import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import DatabaseService from '../../src/dal/DatabaseService.js';
import { DatabaseFactory } from '../../src/dal/DatabaseFactory.js';

// Mock environment variables for testing
const originalEnv = process.env;

describe('DatabaseService', () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
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
    
    // Reset DatabaseService state
    DatabaseService.isInitialized = false;
    DatabaseService.readAdapter = null;
    DatabaseService.writeAdapter = null;
    
    // Reset environment to default
    process.env = {
      ...originalEnv,
      DB_READS: 'mongo',
      DB_WRITES: 'mongo'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    test('should initialize with MongoDB adapters', async () => {
      process.env.DB_READS = 'mongo';
      process.env.DB_WRITES = 'mongo';

      await DatabaseService.initialize();
      
      expect(DatabaseService.isInitialized).toBe(true);
      expect(DatabaseService.readAdapter).toBeTruthy();
      expect(DatabaseService.writeAdapter).toBeTruthy();
    });

    test('should not reinitialize if already initialized', async () => {
      await DatabaseService.initialize();
      const firstReadAdapter = DatabaseService.readAdapter;
      
      await DatabaseService.initialize();
      expect(DatabaseService.readAdapter).toBe(firstReadAdapter);
    });

    test('should provide health check with configuration', async () => {
      await DatabaseService.initialize();
      const health = await DatabaseService.healthCheck();

      expect(health).toHaveProperty('read');
      expect(health).toHaveProperty('write');
      expect(health).toHaveProperty('configuration');
      expect(health.configuration).toEqual({
        reads: 'mongo',
        writes: 'mongo'
      });
    });
  });

  describe('Database Operations', () => {
    beforeEach(async () => {
      await DatabaseService.initialize();
    });

    test('should create and find user through service', async () => {
      const userData = {
        username: 'servicetest',
        password: 'hashedpassword123'
      };

      const createdUser = await DatabaseService.createUser(userData);
      expect(createdUser).toHaveProperty('_id');
      expect(createdUser.username).toBe(userData.username);

      const foundUser = await DatabaseService.findUserById(createdUser._id);
      expect(foundUser.username).toBe(userData.username);
    });

    test('should create and find tenant through service', async () => {
      const tenantData = { name: 'Service Test Tenant' };
      
      const createdTenant = await DatabaseService.createTenant(tenantData);
      expect(createdTenant.name).toBe(tenantData.name);

      const foundTenant = await DatabaseService.findTenantById(createdTenant._id);
      expect(foundTenant.name).toBe(tenantData.name);
    });

    test('should handle token operations through service', async () => {
      // Create prerequisite data
      const tenant = await DatabaseService.createTenant({ name: 'Token Test Tenant' });
      const project = await DatabaseService.createProject({
        name: 'Token Test Project',
        tenant: tenant._id
      });

      const tokenData = {
        tenant: tenant._id,
        project: project._id,
        name: 'test-token',
        value: '#123456',
        category: 'color'
      };

      const createdToken = await DatabaseService.createToken(tokenData);
      expect(createdToken.name).toBe(tokenData.name);

      const foundTokens = await DatabaseService.findTokensByProject(project._id);
      expect(foundTokens).toHaveLength(1);
      expect(foundTokens[0].name).toBe('test-token');
    });
  });

  describe('Disconnect', () => {
    test('should disconnect successfully', async () => {
      await DatabaseService.initialize();
      await expect(DatabaseService.disconnect()).resolves.not.toThrow();
      expect(DatabaseService.isInitialized).toBe(false);
    });
  });
});

describe('DatabaseFactory', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    test('should return default mongo configuration', () => {
      process.env = { ...originalEnv };
      delete process.env.DB_READS;
      delete process.env.DB_WRITES;

      const config = DatabaseFactory.getConfiguration();
      expect(config).toEqual({
        reads: 'mongo',
        writes: 'mongo'
      });
    });

    test('should return custom configuration', () => {
      process.env = {
        ...originalEnv,
        DB_READS: 'supabase',
        DB_WRITES: 'dual'
      };

      const config = DatabaseFactory.getConfiguration();
      expect(config).toEqual({
        reads: 'supabase',
        writes: 'dual'
      });
    });
  });

  describe('Adapter Creation', () => {
    test('should create MongoDB read adapter', () => {
      process.env = { ...originalEnv, DB_READS: 'mongo' };
      
      const adapter = DatabaseFactory.createReadAdapter();
      expect(adapter.constructor.name).toBe('MongoAdapter');
    });

    test('should create MongoDB write adapter', () => {
      process.env = { ...originalEnv, DB_WRITES: 'mongo' };
      
      const adapter = DatabaseFactory.createWriteAdapter();
      expect(adapter.constructor.name).toBe('MongoAdapter');
    });

    test('should throw error for invalid read mode', () => {
      process.env = { ...originalEnv, DB_READS: 'invalid' };
      
      expect(() => DatabaseFactory.createReadAdapter()).toThrow(
        'Unsupported read mode: invalid'
      );
    });

    test('should throw error for invalid write mode', () => {
      process.env = { ...originalEnv, DB_WRITES: 'invalid' };
      
      expect(() => DatabaseFactory.createWriteAdapter()).toThrow(
        'Unsupported write mode: invalid'
      );
    });
  });
});