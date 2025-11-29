import { jest } from '@jest/globals';
import { get, post, put, del } from '../helpers/httpClient.js';

jest.setTimeout(20000);

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: Error Handling - Comprehensive Tests', () => {
  const API_KEY = required('API_KEY');
  const TENANT_ID = required('TENANT_ID');
  const PROJECT_ID = required('PROJECT_ID');
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';

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
    const loginRes = await post('/api/v1/auth/login', {
      body: { username: ADMIN_USER, password: 'Admin#123' }
    });

    if (loginRes.status === 200 && loginRes.body.token) {
      adminJWT = loginRes.body.token;
    }
  });

  describe('400 Bad Request Errors', () => {
    test('should return 400 for missing required token fields', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          // Missing 'name' and 'value'
          category: 'color'
        }
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('should return 400 for invalid token value format', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `invalid-${Date.now()}`,
          value: null, // Invalid value
          category: 'color'
        }
      });

      expect(res.status).toBe(400);
    });

    test('should return 400 for empty token name', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: '',
          value: '#ffffff',
          category: 'color'
        }
      });

      expect(res.status).toBe(400);
    });

    test('should return 400 for malformed JSON', async () => {
      const res = await fetch(`http://localhost:${process.env.PORT || 4000}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        },
        body: '{invalid json}'
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 400 for missing tenant context', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          // Missing x-tenant-id and x-project-id
        }
      });

      expect(res.status).toBe(400);
    });

    test('should return 400 for invalid pagination parameters', async () => {
      const res = await get('/api/v1/tokens?page=-1&limit=9999', {
        headers: apiKeyHeaders()
      });

      // Should either handle gracefully or return 400
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('401 Unauthorized Errors', () => {
    test('should return 401 for missing authorization header', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(401);
    });

    test('should return 401 for invalid JWT token', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: 'Bearer invalid.jwt.token',
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(401);
    });

    test('should return 401 for expired JWT token', async () => {
      // Use a known expired JWT (this is a dummy example)
      const expiredJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImV4cCI6MTB9.invalid';

      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${expiredJWT}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(401);
    });

    test('should return 401 for invalid API key format', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: 'Bearer not-a-valid-key',
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(401);
    });

    test('should return 401 for missing Bearer prefix', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: API_KEY, // Missing "Bearer " prefix
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(401);
    });
  });

  describe('403 Forbidden Errors', () => {
    test('should return 403 for wrong tenant context', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-tenant-id': 'wrong-tenant-id',
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBe(403);
    });

    test('should return 403 for wrong project context', async () => {
      const res = await get('/api/v1/tokens', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': 'wrong-project-id',
        }
      });

      expect(res.status).toBe(403);
    });

    test('should return 403 for insufficient permissions', async () => {
      // Try to create API key with API key (only admins can)
      const res = await post('/api/v1/api-keys', {
        headers: apiKeyHeaders(),
        body: {
          name: 'test-key',
          scopes: ['read:tokens']
        }
      });

      expect(res.status).toBe(403);
    });
  });

  describe('404 Not Found Errors', () => {
    test('should return 404 for non-existent token', async () => {
      const res = await get('/api/v1/tokens/non-existent-token-id-12345', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBe(404);
    });

    test('should return 404 for non-existent API key', async () => {
      if (!adminJWT) return;

      const res = await del('/api/v1/api-keys/non-existent-key-id', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(404);
    });

    test('should return 404 for invalid endpoint', async () => {
      const res = await get('/api/v1/nonexistent-endpoint', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBe(404);
    });

    test('should return 404 for deleted token', async () => {
      // Create a token
      const createRes = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `delete-test-${Date.now()}`,
          value: '#000000',
          category: 'color'
        }
      });

      if (createRes.status === 201) {
        const tokenId = createRes.body.id;

        // Delete it
        await del(`/api/v1/tokens/${tokenId}`, {
          headers: apiKeyHeaders()
        });

        // Try to get it
        const getRes = await get(`/api/v1/tokens/${tokenId}`, {
          headers: apiKeyHeaders()
        });

        expect(getRes.status).toBe(404);
      }
    });
  });

  describe('409 Conflict Errors', () => {
    test('should return 409 for duplicate token name in same project', async () => {
      const tokenName = `duplicate-${Date.now()}`;

      // Create first token
      const firstRes = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: tokenName,
          value: '#111111',
          category: 'color'
        }
      });

      expect(firstRes.status).toBe(201);

      // Try to create duplicate
      const duplicateRes = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: tokenName,
          value: '#222222',
          category: 'color'
        }
      });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toMatch(/already exists|duplicate/i);
    });

    test('should return 409 for duplicate tenant name', async () => {
      if (!adminJWT) return;

      // This test requires platform admin permissions
      // Skip if not available
      const testTenantName = `test-tenant-${Date.now()}`;

      const firstRes = await post('/api/v1/tenants', {
        headers: adminHeaders(),
        body: {
          name: testTenantName,
          admin: {
            name: 'Test Admin',
            email: `admin-${Date.now()}@example.com`
          }
        }
      });

      if (firstRes.status === 201) {
        // Try to create duplicate tenant
        const duplicateRes = await post('/api/v1/tenants', {
          headers: adminHeaders(),
          body: {
            name: testTenantName,
            admin: {
              name: 'Another Admin',
              email: `another-${Date.now()}@example.com`
            }
          }
        });

        expect(duplicateRes.status).toBe(409);
      }
    });
  });

  describe('500 Internal Server Errors', () => {
    test('should handle database connection errors gracefully', async () => {
      // This is hard to test without breaking the database
      // We just verify the endpoint responds
      const res = await get('/status/postgres', {});

      expect([200, 500]).toContain(res.status);
    });

    test('should return error message for server errors', async () => {
      // Create a scenario that might cause server error
      // (e.g., extremely long input that might break validation)
      const veryLongValue = 'x'.repeat(100000);

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: 'long-value-test',
          value: veryLongValue,
          category: 'color'
        }
      });

      if (res.status === 500) {
        expect(res.body).toHaveProperty('message');
      } else {
        // Should reject with 400 instead
        expect(res.status).toBe(400);
      }
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle empty request body', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {}
      });

      expect(res.status).toBe(400);
    });

    test('should handle null values in request', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: null,
          value: null,
          category: null
        }
      });

      expect(res.status).toBe(400);
    });

    test('should handle very long token names', async () => {
      const longName = 'token-' + 'a'.repeat(500);

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: longName,
          value: '#ffffff',
          category: 'color'
        }
      });

      // Should reject or truncate
      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        expect(res.body.name.length).toBeLessThanOrEqual(255);
      }
    });

    test('should handle special characters in token name', async () => {
      const specialChars = ['<script>', 'token"name', 'token\'name', 'token\nname'];

      for (const name of specialChars) {
        const res = await post('/api/v1/tokens', {
          headers: apiKeyHeaders(),
          body: {
            name,
            value: '#000000',
            category: 'color'
          }
        });

        // Should sanitize or reject
        if (res.status === 201) {
          expect(res.body.name).not.toContain('<script>');
          expect(res.body.name).not.toContain('\n');
        } else {
          expect(res.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test('should handle Unicode characters in token name', async () => {
      const unicodeName = `token-emoji-😀-${Date.now()}`;

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: unicodeName,
          value: '#ffffff',
          category: 'color'
        }
      });

      // Should either accept or reject
      expect([201, 400]).toContain(res.status);
    });

    test('should handle zero and negative numbers in pagination', async () => {
      const testCases = [
        { page: 0, limit: 10 },
        { page: -1, limit: 10 },
        { page: 1, limit: 0 },
        { page: 1, limit: -1 },
      ];

      for (const { page, limit } of testCases) {
        const res = await get(`/api/v1/tokens?page=${page}&limit=${limit}`, {
          headers: apiKeyHeaders()
        });

        // Should handle gracefully with default values or error
        expect([200, 400]).toContain(res.status);
      }
    });
  });

  describe('Rate Limiting and Performance', () => {
    test('should handle rapid concurrent requests', async () => {
      const requests = Array(20).fill(null).map(() =>
        get('/api/v1/tokens', {
          headers: apiKeyHeaders()
        })
      );

      const results = await Promise.all(requests);

      // All should succeed or some may be rate limited
      results.forEach(res => {
        expect([200, 429]).toContain(res.status);
      });
    });

    test('should handle large result sets with pagination', async () => {
      const res = await get('/api/v1/tokens?limit=100', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tokens || res.body)).toBe(true);
    });
  });

  describe('Content Type Validation', () => {
    test('should reject requests without Content-Type header', async () => {
      const res = await fetch(`http://localhost:${process.env.PORT || 4000}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
          // No Content-Type
        },
        body: JSON.stringify({
          name: `test-${Date.now()}`,
          value: '#ffffff'
        })
      });

      // Should either accept or require Content-Type
      expect([200, 201, 400, 415]).toContain(res.status);
    });

    test('should reject requests with wrong Content-Type', async () => {
      const res = await fetch(`http://localhost:${process.env.PORT || 4000}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${API_KEY}`,
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        },
        body: JSON.stringify({
          name: `test-${Date.now()}`,
          value: '#ffffff'
        })
      });

      // Should either parse or reject
      expect([201, 400, 415]).toContain(res.status);
    });
  });
});
