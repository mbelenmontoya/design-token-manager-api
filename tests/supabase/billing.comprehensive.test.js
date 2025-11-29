import { jest } from '@jest/globals';
import { get, post } from '../helpers/httpClient.js';

jest.setTimeout(20000);

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: Billing - Comprehensive Tests', () => {
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
    } else {
      console.warn('Admin login failed, billing tests may be skipped');
    }
  });

  describe('Billing Summary Endpoint', () => {
    test('should get billing summary with admin JWT', async () => {
      if (!adminJWT) {
        console.warn('Skipping: Admin JWT not available');
        return;
      }

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    test('billing summary should include required fields', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);

      // Check for expected billing summary structure
      expect(res.body).toHaveProperty('provider');
      expect(res.body).toHaveProperty('plan');
      expect(res.body).toHaveProperty('status');

      // Provider should be either stripe or mercadopago
      expect(['stripe', 'mercadopago']).toContain(res.body.provider);

      // Status should be a valid billing status
      expect(['active', 'inactive', 'trialing', 'past_due', 'canceled']).toContain(res.body.status);
    });

    test('billing summary should include plan details', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);

      // Check for plan information
      const { body } = res;

      if (body.plan) {
        expect(typeof body.plan).toBe('string');
      }

      if (body.amount !== undefined) {
        expect(typeof body.amount).toBe('number');
        expect(body.amount).toBeGreaterThanOrEqual(0);
      }

      if (body.currency) {
        expect(typeof body.currency).toBe('string');
        expect(['usd', 'ars', 'eur', 'gbp']).toContain(body.currency);
      }

      if (body.interval) {
        expect(['month', 'year', 'day']).toContain(body.interval);
      }
    });

    test('billing summary should include usage data', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);

      const { body } = res;

      // Check for usage information (may be stubbed)
      if (body.usage) {
        expect(typeof body.usage).toBe('object');
      }

      if (body.seats) {
        expect(typeof body.seats).toBe('object');
        if (body.seats.used !== undefined) {
          expect(typeof body.seats.used).toBe('number');
        }
        if (body.seats.limit !== undefined) {
          expect(typeof body.seats.limit).toBe('number');
        }
      }
    });

    test('should reject billing summary without authentication', async () => {
      const res = await get('/api/v1/billing/summary', {
        headers: {}
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject billing summary with API key (admin only)', async () => {
      const res = await get('/api/v1/billing/summary', {
        headers: apiKeyHeaders()
      });

      // API keys shouldn't have access to billing
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject billing summary without tenant context', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/summary', {
        headers: {
          Authorization: `Bearer ${adminJWT}`
          // Missing x-tenant-id
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should enforce tenant isolation for billing summary', async () => {
      if (!adminJWT) return;

      // Try to access billing with wrong tenant ID
      const res = await get('/api/v1/billing/summary', {
        headers: {
          Authorization: `Bearer ${adminJWT}`,
          'x-tenant-id': 'wrong-tenant-id',
          'x-project-id': PROJECT_ID
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(403);
    });
  });

  describe('Billing Portal Endpoint', () => {
    test('should get billing portal URL with admin JWT', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/portal', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(typeof res.body.url).toBe('string');
      expect(res.body.url).toMatch(/^https?:\/\//);
    });

    test('billing portal URL should include tenant information', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/portal', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(res.body.url).toContain('tenant=');
      expect(res.body.url).toContain(encodeURIComponent(TENANT_ID));
    });

    test('billing portal URL should include provider information', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/portal', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);
      expect(res.body.url).toMatch(/provider=(stripe|mercadopago)/);
    });

    test('should reject billing portal without authentication', async () => {
      const res = await get('/api/v1/billing/portal', {
        headers: {}
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject billing portal with API key (admin only)', async () => {
      const res = await get('/api/v1/billing/portal', {
        headers: apiKeyHeaders()
      });

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    test('should reject billing portal without tenant context', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/portal', {
        headers: {
          Authorization: `Bearer ${adminJWT}`
          // Missing x-tenant-id
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should enforce tenant isolation for billing portal', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/portal', {
        headers: {
          Authorization: `Bearer ${adminJWT}`,
          'x-tenant-id': 'wrong-tenant-id',
          'x-project-id': PROJECT_ID
        }
      });

      expect(res.status).toBeGreaterThanOrEqual(403);
    });
  });

  describe('Billing Provider Stub Verification', () => {
    test('stripe provider should return valid stub data', async () => {
      if (!adminJWT) return;

      // Set environment to use stripe
      const originalProvider = process.env.BILLING_PROVIDER;
      process.env.BILLING_PROVIDER = 'stripe';

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      // Restore original provider
      if (originalProvider) {
        process.env.BILLING_PROVIDER = originalProvider;
      } else {
        delete process.env.BILLING_PROVIDER;
      }

      if (res.status === 200) {
        expect(res.body.provider).toBe('stripe');
        expect(res.body.currency).toBe('usd');
      }
    });

    test('mercadopago provider should return valid stub data', async () => {
      if (!adminJWT) return;

      const originalProvider = process.env.BILLING_PROVIDER;
      process.env.BILLING_PROVIDER = 'mercadopago';

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      if (originalProvider) {
        process.env.BILLING_PROVIDER = originalProvider;
      } else {
        delete process.env.BILLING_PROVIDER;
      }

      if (res.status === 200) {
        expect(res.body.provider).toBe('mercadopago');
        expect(res.body.currency).toBe('ars');
      }
    });
  });

  describe('Billing Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/summary?invalid=param', {
        headers: adminHeaders()
      });

      // Should either ignore invalid params or return error
      expect([200, 400]).toContain(res.status);
    });

    test('should return consistent error format', async () => {
      const res = await get('/api/v1/billing/summary', {
        headers: {}
      });

      if (res.status >= 400) {
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
      }
    });
  });

  describe('Billing Response Performance', () => {
    test('billing summary should respond quickly', async () => {
      if (!adminJWT) return;

      const startTime = Date.now();

      const res = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('billing portal should respond quickly', async () => {
      if (!adminJWT) return;

      const startTime = Date.now();

      const res = await get('/api/v1/billing/portal', {
        headers: adminHeaders()
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    test('should handle concurrent billing requests', async () => {
      if (!adminJWT) return;

      const requests = Array(5).fill(null).map(() =>
        get('/api/v1/billing/summary', {
          headers: adminHeaders()
        })
      );

      const results = await Promise.all(requests);

      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Billing Data Consistency', () => {
    test('multiple calls should return consistent data', async () => {
      if (!adminJWT) return;

      const res1 = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      const res2 = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Stub data should be consistent
      expect(res1.body.provider).toBe(res2.body.provider);
      expect(res1.body.plan).toBe(res2.body.plan);
      expect(res1.body.status).toBe(res2.body.status);
    });

    test('portal URLs should be valid and accessible format', async () => {
      if (!adminJWT) return;

      const res = await get('/api/v1/billing/portal', {
        headers: adminHeaders()
      });

      expect(res.status).toBe(200);

      // URL should be properly formatted
      const url = new URL(res.body.url);
      expect(url.protocol).toMatch(/^https?:$/);
      expect(url.searchParams.has('tenant')).toBe(true);
    });
  });

  describe('Billing Webhook Integration', () => {
    test('webhook endpoint should be accessible', async () => {
      const res = await post('/webhooks/mercadopago', {
        body: {
          type: 'payment',
          data: {
            tenantId: TENANT_ID,
            status: 'approved'
          }
        }
      });

      // Webhook should respond (may require signature in production)
      expect([200, 401]).toContain(res.status);
    });

    test('webhook should accept valid billing status updates', async () => {
      const validStatuses = ['active', 'inactive', 'past_due', 'canceled', 'trialing'];

      for (const status of validStatuses) {
        const res = await post('/webhooks/mercadopago', {
          body: {
            type: status,
            data: {
              tenantId: TENANT_ID
            }
          }
        });

        // Webhook should process or reject based on signature
        expect([200, 401]).toContain(res.status);
      }
    });

    test('webhook should handle missing tenant ID gracefully', async () => {
      const res = await post('/webhooks/mercadopago', {
        body: {
          type: 'payment',
          data: {
            // Missing tenantId
            status: 'approved'
          }
        }
      });

      // Should not crash, always return 200 to prevent retries
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('webhook should handle invalid data gracefully', async () => {
      const res = await post('/webhooks/mercadopago', {
        body: {
          // Minimal/invalid payload
          invalid: 'data'
        }
      });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('webhook should handle empty payload', async () => {
      const res = await post('/webhooks/mercadopago', {
        body: {}
      });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('Billing Role-Based Access Control', () => {
    test('admin role should have full billing access', async () => {
      if (!adminJWT) return;

      const summaryRes = await get('/api/v1/billing/summary', {
        headers: adminHeaders()
      });

      const portalRes = await get('/api/v1/billing/portal', {
        headers: adminHeaders()
      });

      expect(summaryRes.status).toBe(200);
      expect(portalRes.status).toBe(200);
    });

    test('non-admin roles should not access billing', async () => {
      // API keys (non-admin) should not access billing
      const summaryRes = await get('/api/v1/billing/summary', {
        headers: apiKeyHeaders()
      });

      expect(summaryRes.status).toBeGreaterThanOrEqual(401);
    });
  });
});
