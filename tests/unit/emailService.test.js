import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createEmailProvider, resetEmailProvider } from '../../src/services/email/EmailServiceFactory.js';
import { ConsoleEmailProvider } from '../../src/services/email/ConsoleEmailProvider.js';
import { SendGridEmailProvider } from '../../src/services/email/SendGridEmailProvider.js';
import { ResendEmailProvider } from '../../src/services/email/ResendEmailProvider.js';
import * as templates from '../../src/services/email/emailTemplates.js';

describe('Email Service', () => {
  beforeEach(() => {
    resetEmailProvider();
    // Clear environment variables
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    resetEmailProvider();
  });

  describe('EmailServiceFactory', () => {
    it('should create console provider by default', () => {
      const provider = createEmailProvider();
      expect(provider).toBeInstanceOf(ConsoleEmailProvider);
      expect(provider.getName()).toBe('console');
    });

    it('should create console provider when explicitly requested', () => {
      const provider = createEmailProvider({ provider: 'console' });
      expect(provider).toBeInstanceOf(ConsoleEmailProvider);
    });

    it('should create SendGrid provider when configured', () => {
      process.env.SENDGRID_API_KEY = 'test_key';
      const provider = createEmailProvider({ provider: 'sendgrid' });
      expect(provider).toBeInstanceOf(SendGridEmailProvider);
      expect(provider.getName()).toBe('sendgrid');
    });

    it('should create Resend provider when configured', () => {
      process.env.RESEND_API_KEY = 're_test_key';
      const provider = createEmailProvider({ provider: 'resend' });
      expect(provider).toBeInstanceOf(ResendEmailProvider);
      expect(provider.getName()).toBe('resend');
    });

    it('should fall back to console for unknown provider', () => {
      const provider = createEmailProvider({ provider: 'unknown' });
      expect(provider).toBeInstanceOf(ConsoleEmailProvider);
    });

    it('should throw error for SendGrid without API key', () => {
      delete process.env.SENDGRID_API_KEY;
      expect(() => {
        createEmailProvider({ provider: 'sendgrid' });
      }).toThrow('SendGrid API key not configured');
    });

    it('should throw error for Resend without API key', () => {
      delete process.env.RESEND_API_KEY;
      expect(() => {
        createEmailProvider({ provider: 'resend' });
      }).toThrow('Resend API key not configured');
    });
  });

  describe('ConsoleEmailProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new ConsoleEmailProvider();
    });

    it('should send email successfully', async () => {
      const result = await provider.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.provider).toBe('console');
    });

    it('should verify connection successfully', async () => {
      const result = await provider.verifyConnection();
      expect(result).toBe(true);
    });

    it('should use default from address', async () => {
      const result = await provider.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Email Templates', () => {
    describe('tenantAdminInvitationEmail', () => {
      it('should generate tenant admin invitation email', () => {
        const result = templates.tenantAdminInvitationEmail({
          adminName: 'John Doe',
          tenantName: 'Acme Corp',
          invitationLink: 'https://example.com/invite?token=abc123'
        });

        expect(result.subject).toContain('Acme Corp');
        expect(result.html).toContain('John Doe');
        expect(result.html).toContain('Acme Corp');
        expect(result.html).toContain('https://example.com/invite?token=abc123');
        expect(result.text).toContain('John Doe');
        expect(result.text).toContain('https://example.com/invite?token=abc123');
      });

      it('should use custom expiration time', () => {
        const result = templates.tenantAdminInvitationEmail({
          adminName: 'John Doe',
          tenantName: 'Acme Corp',
          invitationLink: 'https://example.com/invite?token=abc123',
          expiresIn: '24 hours'
        });

        expect(result.html).toContain('24 hours');
        expect(result.text).toContain('24 hours');
      });
    });

    describe('teamMemberInvitationEmail', () => {
      it('should generate team member invitation email', () => {
        const result = templates.teamMemberInvitationEmail({
          memberName: 'Jane Smith',
          tenantName: 'Acme Corp',
          inviterName: 'John Doe',
          role: 'editor',
          invitationLink: 'https://example.com/invite?token=xyz789'
        });

        expect(result.subject).toContain('John Doe');
        expect(result.subject).toContain('Acme Corp');
        expect(result.html).toContain('Jane Smith');
        expect(result.html).toContain('John Doe');
        expect(result.html).toContain('editor');
        expect(result.html).toContain('https://example.com/invite?token=xyz789');
      });

      it('should handle different roles', () => {
        const adminResult = templates.teamMemberInvitationEmail({
          memberName: 'User',
          tenantName: 'Org',
          inviterName: 'Admin',
          role: 'admin',
          invitationLink: 'https://example.com/invite'
        });

        expect(adminResult.html).toContain('full administrative access');

        const viewerResult = templates.teamMemberInvitationEmail({
          memberName: 'User',
          tenantName: 'Org',
          inviterName: 'Admin',
          role: 'viewer',
          invitationLink: 'https://example.com/invite'
        });

        expect(viewerResult.html).toContain('view design tokens');
      });
    });

    describe('passwordResetEmail', () => {
      it('should generate password reset email', () => {
        const result = templates.passwordResetEmail({
          userName: 'John Doe',
          resetLink: 'https://example.com/reset?token=reset123',
          expiresIn: '1 hour'
        });

        expect(result.subject).toContain('Reset your');
        expect(result.html).toContain('John Doe');
        expect(result.html).toContain('https://example.com/reset?token=reset123');
        expect(result.html).toContain('1 hour');
        expect(result.text).toContain('John Doe');
        expect(result.text).toContain('https://example.com/reset?token=reset123');
      });
    });
  });

  describe('Email Template HTML Structure', () => {
    it('should include proper HTML structure', () => {
      const result = templates.tenantAdminInvitationEmail({
        adminName: 'Test',
        tenantName: 'Test Org',
        invitationLink: 'https://example.com'
      });

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html');
      expect(result.html).toContain('</html>');
      expect(result.html).toContain('<head>');
      expect(result.html).toContain('<body>');
    });

    it('should include CSS styles', () => {
      const result = templates.tenantAdminInvitationEmail({
        adminName: 'Test',
        tenantName: 'Test Org',
        invitationLink: 'https://example.com'
      });

      expect(result.html).toContain('<style>');
      expect(result.html).toContain('.container');
      expect(result.html).toContain('.button');
    });

    it('should be responsive', () => {
      const result = templates.tenantAdminInvitationEmail({
        adminName: 'Test',
        tenantName: 'Test Org',
        invitationLink: 'https://example.com'
      });

      expect(result.html).toContain('max-width');
      expect(result.html).toContain('viewport');
    });
  });
});
