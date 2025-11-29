import { jest } from '@jest/globals';
import { get, post } from '../helpers/httpClient.js';

jest.setTimeout(20000);

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: Categories - Comprehensive Tests', () => {
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
    // Login as admin
    const loginRes = await post('/api/v1/auth/login', {
      body: { username: ADMIN_USER, password: 'Admin#123' }
    });

    if (loginRes.status === 200 && loginRes.body.token) {
      adminJWT = loginRes.body.token;
    }
  });

  describe('Category Retrieval', () => {
    test('should get list of categories with admin JWT', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/categories', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories || res.body)).toBe(true);
    });

    test('should get list of categories with API key', async () => {
      const res = await get('/api/v1/categories', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories || res.body)).toBe(true);
    });

    test('should return standard token categories', async () => {
      const res = await get('/api/v1/categories', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      const categories = res.body.categories || res.body;

      // Standard categories should include these
      const categoryNames = categories.map(c => c.name || c);
      const expectedCategories = ['color', 'spacing', 'typography', 'shadow'];

      expectedCategories.forEach(expected => {
        expect(categoryNames).toContain(expected);
      });
    });

    test('should reject unauthenticated category requests', async () => {
      const res = await get('/api/v1/categories', {
        headers: {}
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('Category Data Structure', () => {
    test('categories should have consistent structure', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/categories', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      const categories = res.body.categories || res.body;

      if (categories.length > 0) {
        categories.forEach(category => {
          // Categories should be either strings or objects with name property
          if (typeof category === 'object') {
            expect(category).toHaveProperty('name');
          } else {
            expect(typeof category).toBe('string');
          }
        });
      }
    });

    test('should return categories in consistent format', async () => {
      const res = await get('/api/v1/categories', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();

      // Should be wrapped in categories property or be array
      const categories = res.body.categories || res.body;
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('Category Edge Cases', () => {
    test('should handle empty category list gracefully', async () => {
      // Even if no custom categories, should return default categories
      const res = await get('/api/v1/categories', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBe(200);
      const categories = res.body.categories || res.body;
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0); // Should have defaults
    });

    test('should reject requests with invalid tenant context', async () => {
      const res = await get('/api/v1/categories', {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-tenant-id': 'invalid-tenant',
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(403);
    });

    test('should handle malformed authorization header', async () => {
      const res = await get('/api/v1/categories', {
        headers: {
          Authorization: 'InvalidFormat',
          'x-tenant-id': TENANT_ID,
          'x-project-id': PROJECT_ID,
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('Category Usage in Tokens', () => {
    test('should accept tokens with standard categories', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `category-test-${Date.now()}`,
          value: '#123456',
          category: 'color'
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe('color');
    });

    test('should accept tokens with other categories', async () => {
      const categories = ['spacing', 'typography', 'shadow', 'other'];

      for (const category of categories) {
        const res = await post('/api/v1/tokens', {
          headers: apiKeyHeaders(),
          body: {
            name: `${category}-test-${Date.now()}`,
            value: 'test-value',
            category
          }
        });

        expect(res.status).toBe(201);
        expect(res.body.category).toBe(category);
      }
    });

    test('should handle tokens without category', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `no-category-${Date.now()}`,
          value: 'test-value'
        }
      });

      // Should either accept with default category or require category
      expect([201, 400]).toContain(res.status);
    });

    test('should filter tokens by category', async () => {
      // Create a token with specific category
      const testCategory = 'color';
      const createRes = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `filter-test-${Date.now()}`,
          value: '#abcdef',
          category: testCategory
        }
      });

      expect(createRes.status).toBe(201);

      // Query tokens by category
      const queryRes = await get(`/api/v1/tokens?category=${testCategory}`, {
        headers: apiKeyHeaders()
      });

      expect(queryRes.status).toBe(200);
      const tokens = queryRes.body.tokens || queryRes.body;

      if (Array.isArray(tokens)) {
        tokens.forEach(token => {
          expect(token.category).toBe(testCategory);
        });
      }
    });
  });

  describe('Category Validation', () => {
    test('should handle case sensitivity in categories', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `case-test-${Date.now()}`,
          value: '#000000',
          category: 'Color' // Capital C
        }
      });

      // Should either normalize to lowercase or reject
      expect([201, 400]).toContain(res.status);
    });

    test('should reject very long category names', async () => {
      const longCategory = 'a'.repeat(256);

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `long-cat-${Date.now()}`,
          value: 'test',
          category: longCategory
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should reject categories with special characters', async () => {
      const invalidCategories = ['cat/egory', 'cat<>egory', 'cat;egory'];

      for (const category of invalidCategories) {
        const res = await post('/api/v1/tokens', {
          headers: apiKeyHeaders(),
          body: {
            name: `invalid-${Date.now()}`,
            value: 'test',
            category
          }
        });

        // Should reject or sanitize
        if (res.status === 201) {
          expect(res.body.category).not.toBe(category);
        } else {
          expect(res.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test('should handle empty category string', async () => {
      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: {
          name: `empty-cat-${Date.now()}`,
          value: 'test',
          category: ''
        }
      });

      // Should either use default or reject
      expect([201, 400]).toContain(res.status);
    });
  });

  describe('Category Performance', () => {
    test('should return categories quickly', async () => {
      const startTime = Date.now();

      const res = await get('/api/v1/categories', {
        headers: apiKeyHeaders()
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent category requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        get('/api/v1/categories', {
          headers: apiKeyHeaders()
        })
      );

      const results = await Promise.all(requests);

      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });
});
