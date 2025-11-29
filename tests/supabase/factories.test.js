import { jest } from '@jest/globals';
import { post, del } from '../helpers/httpClient.js';
import {
  createTestToken,
  createColorToken,
  createSpacingToken,
  createTypographyToken,
  createShadowToken,
  createMixedCategoryTokens,
  createInvalidToken,
  createTestTokenBatch
} from '../helpers/testFactories.js';

jest.setTimeout(20000);

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: Test Factories', () => {
  const API_KEY = required('API_KEY');
  const TENANT_ID = required('TENANT_ID');
  const PROJECT_ID = required('PROJECT_ID');

  const apiKeyHeaders = () => ({
    Authorization: `Bearer ${API_KEY}`,
    'x-tenant-id': TENANT_ID,
    'x-project-id': PROJECT_ID,
  });

  const createdTokenIds = [];

  afterAll(async () => {
    // Cleanup created tokens
    for (const tokenId of createdTokenIds) {
      try {
        await del(`/api/v1/tokens/${tokenId}`, {
          headers: apiKeyHeaders()
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Generic Token Factory', () => {
    test('should create valid token with default values', async () => {
      const tokenData = createTestToken();

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: tokenData
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(tokenData.name);
      expect(res.body.value).toBe(tokenData.value);
      expect(res.body.category).toBe(tokenData.category);

      if (res.status === 201) {
        createdTokenIds.push(res.body.id);
      }
    });

    test('should create token with overridden values', async () => {
      const customToken = createTestToken({
        category: 'spacing',
        value: '16px',
        description: 'Custom test token'
      });

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: customToken
      });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe('spacing');
      expect(res.body.value).toBe('16px');

      if (res.status === 201) {
        createdTokenIds.push(res.body.id);
      }
    });

    test('should create multiple unique tokens', async () => {
      const token1 = createTestToken();
      const token2 = createTestToken();

      expect(token1.name).not.toBe(token2.name);
      expect(token1).not.toEqual(token2);
    });
  });

  describe('Category-Specific Factories', () => {
    test('should create valid color token', async () => {
      const colorToken = createColorToken();

      expect(colorToken.category).toBe('color');
      expect(colorToken.value).toMatch(/^#[0-9A-F]{6}$/i);

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: colorToken
      });

      expect(res.status).toBe(201);

      if (res.status === 201) {
        createdTokenIds.push(res.body.id);
      }
    });

    test('should create valid spacing token', async () => {
      const spacingToken = createSpacingToken();

      expect(spacingToken.category).toBe('spacing');
      expect(spacingToken.value).toMatch(/^\d+px$/);

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: spacingToken
      });

      expect(res.status).toBe(201);

      if (res.status === 201) {
        createdTokenIds.push(res.body.id);
      }
    });

    test('should create valid typography token', async () => {
      const typoToken = createTypographyToken();

      expect(typoToken.category).toBe('typography');
      expect(typoToken.value).toBeDefined();

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: typoToken
      });

      expect(res.status).toBe(201);

      if (res.status === 201) {
        createdTokenIds.push(res.body.id);
      }
    });

    test('should create valid shadow token', async () => {
      const shadowToken = createShadowToken();

      expect(shadowToken.category).toBe('shadow');
      expect(shadowToken.value).toContain('rgba');

      const res = await post('/api/v1/tokens', {
        headers: apiKeyHeaders(),
        body: shadowToken
      });

      expect(res.status).toBe(201);

      if (res.status === 201) {
        createdTokenIds.push(res.body.id);
      }
    });
  });

  describe('Batch Token Creation', () => {
    test('should create batch of tokens', async () => {
      const batch = createTestTokenBatch(5);

      expect(batch).toHaveLength(5);
      expect(batch[0].name).not.toBe(batch[1].name);

      // Create all tokens
      for (const tokenData of batch) {
        const res = await post('/api/v1/tokens', {
          headers: apiKeyHeaders(),
          body: tokenData
        });

        expect(res.status).toBe(201);

        if (res.status === 201) {
          createdTokenIds.push(res.body.id);
        }
      }
    });

    test('should create mixed category tokens', async () => {
      const mixed = createMixedCategoryTokens(8);

      expect(mixed).toHaveLength(8);

      const categories = mixed.map(t => t.category);
      const uniqueCategories = [...new Set(categories)];

      expect(uniqueCategories.length).toBeGreaterThan(1);
      expect(uniqueCategories).toContain('color');
      expect(uniqueCategories).toContain('spacing');
    });

    test('should create batch with consistent overrides', async () => {
      const batch = createTestTokenBatch(3, {
        category: 'color',
        description: 'Batch token'
      });

      batch.forEach(token => {
        expect(token.category).toBe('color');
        expect(token.description).toBe('Batch token');
      });
    });
  });

  describe('Invalid Token Factories', () => {
    test('should generate token with missing name', () => {
      const invalid = createInvalidToken('missing_name');

      expect(invalid).not.toHaveProperty('name');
      expect(invalid).toHaveProperty('value');
    });

    test('should generate token with missing value', () => {
      const invalid = createInvalidToken('missing_value');

      expect(invalid).toHaveProperty('name');
      expect(invalid).not.toHaveProperty('value');
    });

    test('should generate token with empty name', () => {
      const invalid = createInvalidToken('empty_name');

      expect(invalid.name).toBe('');
    });

    test('should generate token with null value', () => {
      const invalid = createInvalidToken('null_value');

      expect(invalid.value).toBeNull();
    });

    test('should generate token with invalid category', () => {
      const invalid = createInvalidToken('invalid_category');

      expect(invalid.category).toMatch(/[<>]/);
    });

    test('should generate token with very long name', () => {
      const invalid = createInvalidToken('very_long_name');

      expect(invalid.name.length).toBeGreaterThan(400);
    });

    test('should generate token with special characters', () => {
      const invalid = createInvalidToken('special_chars');

      expect(invalid.name).toContain('<script>');
    });
  });

  describe('Factory Validation Against API', () => {
    test('invalid tokens should be rejected by API', async () => {
      const invalidTypes = [
        'missing_name',
        'missing_value',
        'empty_name',
        'null_value'
      ];

      for (const type of invalidTypes) {
        const invalid = createInvalidToken(type);

        const res = await post('/api/v1/tokens', {
          headers: apiKeyHeaders(),
          body: invalid
        });

        expect(res.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('factory-generated tokens should pass validation', async () => {
      const factories = [
        createColorToken,
        createSpacingToken,
        createTypographyToken,
        createShadowToken
      ];

      for (const factory of factories) {
        const token = factory();

        const res = await post('/api/v1/tokens', {
          headers: apiKeyHeaders(),
          body: token
        });

        expect(res.status).toBe(201);

        if (res.status === 201) {
          createdTokenIds.push(res.body.id);
        }
      }
    });
  });

  describe('Factory Consistency', () => {
    test('factories should generate unique IDs', () => {
      const tokens = Array(100).fill(null).map(() => createTestToken());
      const names = tokens.map(t => t.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(100);
    });

    test('color factory should generate valid hex colors', () => {
      const colors = Array(20).fill(null).map(() => createColorToken());

      colors.forEach(token => {
        expect(token.value).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('spacing factory should generate valid pixel values', () => {
      const spacings = Array(20).fill(null).map(() => createSpacingToken());

      spacings.forEach(token => {
        expect(token.value).toMatch(/^\d+px$/);
      });
    });

    test('factories should respect overrides consistently', () => {
      const customValue = '#CUSTOM';

      const tokens = Array(10).fill(null).map(() =>
        createColorToken({ value: customValue })
      );

      tokens.forEach(token => {
        expect(token.value).toBe(customValue);
      });
    });
  });

  describe('Factory Performance', () => {
    test('should generate large batches quickly', () => {
      const startTime = Date.now();

      const batch = createTestTokenBatch(1000);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(batch).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
    });

    test('should generate mixed categories quickly', () => {
      const startTime = Date.now();

      const mixed = createMixedCategoryTokens(100);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(mixed).toHaveLength(100);
      expect(duration).toBeLessThan(500);
    });
  });
});
