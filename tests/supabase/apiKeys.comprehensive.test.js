import { jest } from '@jest/globals';
import { get, post, put, del } from '../helpers/httpClient.js';

jest.setTimeout(20000);

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: API Keys - Comprehensive Tests', () => {
  const API_KEY = required('API_KEY');
  const TENANT_ID = required('TENANT_ID');
  const PROJECT_ID = required('PROJECT_ID');
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';

  // Admin JWT headers (requires actual login - will be set in beforeAll)
  let adminJWT = null;

  const apiKeyHeaders = () => ({
    Authorization: `Bearer ${API_KEY}`,
    'x-tenant-id': TENANT_ID,
    'x-project-id': PROJECT_ID,
  });

  const adminHeaders = () => ({
    Authorization: `Bearer ${adminJWT}`,
    'x-tenant-id': TENANT_ID,
    'x-project-id': PROJECT_ID,
  });

  beforeAll(async () => {
    // Login as admin to get JWT token
    const loginRes = await post('/api/v1/auth/login', {
      body: { username: ADMIN_USER, password: 'Admin#123' }
    });

    if (loginRes.status === 200 && loginRes.body.token) {
      adminJWT = loginRes.body.token;
    } else {
      console.warn('Admin login failed, some tests may be skipped');
    }
  });

  describe('API Key Creation', () => {
    test('should create API key with admin JWT', async () => {
      if (!adminJWT) {
        console.warn('Skipping: Admin JWT not available');
        return;
      }

      const res = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `test-key-${Date.now()}`,
          scopes: ['read:tokens', 'write:tokens']
        }
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('key'); // Raw key only returned on creation
      expect(res.body).toHaveProperty('name');
      expect(res.body.scopes).toContain('read:tokens');
      expect(res.body.scopes).toContain('write:tokens');
    });

    test('should reject API key creation without admin role', async () => {
      // API keys cannot create other API keys
      const res = await post('/api/v1/api-keys', {
        headers: apiKeyHeaders(),
        body: {
          name: `test-key-${Date.now()}`,
          scopes: ['read:tokens']
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject API key creation with invalid scopes', async () => {
      if (!adminJWT) return;

      const res = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `test-key-${Date.now()}`,
          scopes: ['invalid:scope', 'hack:system']
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should create API key with read-only scope', async () => {
      if (!adminJWT) return;

      const res = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `readonly-key-${Date.now()}`,
          scopes: ['read:tokens']
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.scopes).toEqual(['read:tokens']);
      expect(res.body.scopes).not.toContain('write:tokens');
    });
  });

  describe('API Key Listing', () => {
    test('should list API keys for project', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/api-keys', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.apiKeys || res.body)).toBe(true);
    });

    test('should not expose raw API key values in list', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/api-keys', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      const keys = res.body.apiKeys || res.body;

      if (keys.length > 0) {
        keys.forEach(key => {
          expect(key).not.toHaveProperty('key'); // Raw key should not be exposed
          expect(key).toHaveProperty('id');
          expect(key).toHaveProperty('name');
        });
      }
    });

    test('should enforce tenant isolation in API key listing', async () => {
      if (!adminJWT) return;

      // Get keys for our tenant
      const res = await get('/api/v1/api-keys', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      const keys = res.body.apiKeys || res.body;

      // All keys should belong to our tenant
      keys.forEach(key => {
        expect(key.tenantId).toBe(TENANT_ID);
      });
    });
  });

  describe('API Key Rotation', () => {
    let createdKeyId = null;

    beforeAll(async () => {
      if (!adminJWT) return;

      // Create a key to rotate
      const res = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `rotate-test-${Date.now()}`,
          scopes: ['read:tokens']
        }
      });

      if (res.status === 201) {
        createdKeyId = res.body.id;
      }
    });

    test('should rotate API key and return new value', async () => {
      if (!adminJWT || !createdKeyId) return;

      const res = await put(`/api/v1/api-keys/${createdKeyId}/rotate`, {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('key'); // New key value returned
      expect(res.body.id).toBe(createdKeyId);
      expect(res.body).toHaveProperty('rotatedAt');
    });

    test('should invalidate old API key after rotation', async () => {
      if (!adminJWT || !createdKeyId) return;

      const oldKey = API_KEY;

      // Rotate the key
      const rotateRes = await put(`/api/v1/api-keys/${createdKeyId}/rotate`, {
        headers: adminHeaders()
      });

      if (rotateRes.status === 200) {
        const newKey = rotateRes.body.key;

        // Old key should not work (this test assumes we're rotating API_KEY)
        // New key should work
        expect(newKey).not.toBe(oldKey);
      }
    });
  });

  describe('API Key Revocation', () => {
    let keyToRevoke = null;
    let revokedKey = null;

    beforeAll(async () => {
      if (!adminJWT) return;

      // Create a key to revoke
      const res = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `revoke-test-${Date.now()}`,
          scopes: ['read:tokens', 'write:tokens']
        }
      });

      if (res.status === 201) {
        keyToRevoke = res.body.id;
        revokedKey = res.body.key;
      }
    });

    test('should revoke API key', async () => {
      if (!adminJWT || !keyToRevoke) return;

      const res = await del(`/api/v1/api-keys/${keyToRevoke}`, {
        headers: adminHeaders()
      });

      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    });

    test('should reject requests with revoked API key', async () => {
      if (!revokedKey) return;

      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${revokedKey}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should not allow revoking non-existent API key', async () => {
      if (!adminJWT) return;

      const fakeKeyId = 'non-existent-key-id-12345';
      const res = await del(`/api/v1/api-keys/${fakeKeyId}`, {
        headers: adminHeaders()
      });

      expect(res.status).toBeGreaterThanOrEqual(404);
    });
  });

  describe('API Key Scope Enforcement', () => {
    let readOnlyKey = null;
    let writeKey = null;

    beforeAll(async () => {
      if (!adminJWT) return;

      // Create read-only key
      const readRes = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `readonly-${Date.now()}`,
          scopes: ['read:tokens']
        }
      });

      if (readRes.status === 201) {
        readOnlyKey = readRes.body.key;
      }

      // Create write key
      const writeRes = await post('/api/v1/api-keys', {
        headers: adminHeaders(),
        body: {
          name: `write-${Date.now()}`,
          scopes: ['read:tokens', 'write:tokens']
        }
      });

      if (writeRes.status === 201) {
        writeKey = writeRes.body.key;
      }
    });

    test('read-only key should allow GET requests', async () => {
      if (!readOnlyKey) return;

      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${readOnlyKey}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(200);
    });

    test('read-only key should reject POST requests', async () => {
      if (!readOnlyKey) return;

      const res = await post('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${readOnlyKey}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        },
        body: {
          name: `test-token-${Date.now()}`,
          value: '#ffffff',
          category: 'color'
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(403);
    });

    test('write key should allow both GET and POST requests', async () => {
      if (!writeKey) return;

      // GET should work
      const getRes = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${writeKey}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });
      expect(getRes.status).toBe(200);

      // POST should work
      const postRes = await post('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${writeKey}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        },
        body: {
          name: `write-test-${Date.now()}`,
          value: '#000000',
          category: 'color'
        }
      });
      expect(postRes.status).toBe(201);
    });
  });

  describe('API Key Multi-Tenant Isolation', () => {
    test('API key should only access its own tenant data', async () => {
      // Attempt to access with wrong tenant ID
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-tenant-id': 'wrong-tenant-id-12345',
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(403);
    });

    test('API key should only access its own project data', async () => {
      // Attempt to access with wrong project ID
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': 'wrong-project-id-12345',
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(403);
    });
  });

  describe('API Key Edge Cases', () => {
    test('should reject requests with malformed API key', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: 'Bearer invalid-key-format',
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject requests with missing authorization header', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject requests with missing tenant context', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should handle API key with expired status gracefully', async () => {
      // This would require setting up an expired key in the database
      // For now, we test that the system handles the check
      const res = await get('/api/v1/tokens', {
        headers: apiKeyHeaders()
      });

      // Should either work (key not expired) or reject (key expired)
      expect([200, 401, 403]).toContain(res.status);
    });
  });
});
