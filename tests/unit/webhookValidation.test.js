import { describe, it, expect, beforeEach } from '@jest/globals';
import crypto from 'crypto';
import { validateMercadoPagoSignature } from '../../src/utils/webhookValidation.js';

describe('Webhook Signature Validation', () => {
  const secret = 'test_webhook_secret_12345';
  const testBody = JSON.stringify({ type: 'payment', data: { id: '123456' } });

  /**
   * Helper function to generate valid Mercado Pago signature
   */
  function generateValidSignature(body, timestamp = Date.now()) {
    const message = `ts=${timestamp}&data=${body}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    return `ts=${timestamp},v1=${signature}`;
  }

  describe('validateMercadoPagoSignature', () => {
    it('should validate a correct signature', () => {
      const signature = generateValidSignature(testBody);
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing signature', () => {
      const result = validateMercadoPagoSignature({ signature: null, body: testBody, secret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing X-Signature header');
    });

    it('should reject missing secret', () => {
      const signature = generateValidSignature(testBody);
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret: null });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Webhook secret not configured');
    });

    it('should reject invalid signature format', () => {
      const result = validateMercadoPagoSignature({
        signature: 'invalid_format',
        body: testBody,
        secret
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should reject expired timestamp (older than 5 minutes)', () => {
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000);
      const signature = generateValidSignature(testBody, sixMinutesAgo);
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature timestamp expired');
    });

    it('should reject future timestamp (more than 5 minutes ahead)', () => {
      const sixMinutesFromNow = Date.now() + (6 * 60 * 1000);
      const signature = generateValidSignature(testBody, sixMinutesFromNow);
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Signature timestamp expired');
    });

    it('should reject tampered body content', () => {
      const signature = generateValidSignature(testBody);
      const tamperedBody = JSON.stringify({ type: 'payment', data: { id: '999999' } });
      const result = validateMercadoPagoSignature({ signature, body: tamperedBody, secret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject incorrect secret', () => {
      const signature = generateValidSignature(testBody);
      const wrongSecret = 'wrong_secret';
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret: wrongSecret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should accept signature within 5 minute window', () => {
      const fourMinutesAgo = Date.now() - (4 * 60 * 1000);
      const signature = generateValidSignature(testBody, fourMinutesAgo);
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle signature with missing ts parameter', () => {
      const signature = 'v1=abc123def456';
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should handle signature with missing v1 parameter', () => {
      const signature = `ts=${Date.now()}`;
      const result = validateMercadoPagoSignature({ signature, body: testBody, secret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should handle different body content types', () => {
      const complexBody = JSON.stringify({
        type: 'payment',
        data: {
          id: '123456',
          status: 'approved',
          metadata: {
            tenantId: 'tenant_abc',
            amount: 100.50
          }
        }
      });

      const signature = generateValidSignature(complexBody);
      const result = validateMercadoPagoSignature({ signature, body: complexBody, secret });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
