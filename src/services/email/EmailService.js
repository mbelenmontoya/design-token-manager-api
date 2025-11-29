import { getEmailProvider } from './EmailServiceFactory.js';
import * as templates from './emailTemplates.js';

/**
 * Email Service
 *
 * High-level email service that combines provider abstraction with template system.
 * Use this service throughout the application for sending emails.
 *
 * Example usage:
 * ```
 * import emailService from './services/email/EmailService.js';
 *
 * await emailService.sendTenantAdminInvitation({
 *   to: 'admin@example.com',
 *   adminName: 'John Doe',
 *   tenantName: 'Acme Corp',
 *   invitationLink: 'https://app.example.com/accept?token=...'
 * });
 * ```
 */
class EmailService {
  /**
   * Send tenant admin invitation email
   *
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.adminName - Admin name
   * @param {string} params.tenantName - Tenant organization name
   * @param {string} params.invitationLink - Full invitation URL
   * @param {string} [params.expiresIn] - Expiration time (default: "72 hours")
   * @returns {Promise<Object>} { success, messageId?, error? }
   */
  async sendTenantAdminInvitation({ to, adminName, tenantName, invitationLink, expiresIn }) {
    try {
      const provider = getEmailProvider();
      const { subject, html, text } = templates.tenantAdminInvitationEmail({
        adminName,
        tenantName,
        invitationLink,
        expiresIn
      });

      const result = await provider.sendEmail({ to, subject, html, text });

      if (result.success) {
        console.log(`✅ Sent tenant admin invitation to ${to} (${result.provider})`);
      } else {
        console.error(`❌ Failed to send tenant admin invitation to ${to}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Email service error (tenant admin invitation):', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send team member invitation email
   *
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.memberName - Member name
   * @param {string} params.tenantName - Tenant organization name
   * @param {string} params.inviterName - Name of person sending invitation
   * @param {string} params.role - Role being granted (admin, editor, viewer)
   * @param {string} params.invitationLink - Full invitation URL
   * @param {string} [params.expiresIn] - Expiration time (default: "72 hours")
   * @returns {Promise<Object>} { success, messageId?, error? }
   */
  async sendTeamMemberInvitation({ to, memberName, tenantName, inviterName, role, invitationLink, expiresIn }) {
    try {
      const provider = getEmailProvider();
      const { subject, html, text } = templates.teamMemberInvitationEmail({
        memberName,
        tenantName,
        inviterName,
        role,
        invitationLink,
        expiresIn
      });

      const result = await provider.sendEmail({ to, subject, html, text });

      if (result.success) {
        console.log(`✅ Sent team member invitation to ${to} (${result.provider})`);
      } else {
        console.error(`❌ Failed to send team member invitation to ${to}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Email service error (team member invitation):', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   *
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.userName - User name
   * @param {string} params.resetLink - Full password reset URL
   * @param {string} [params.expiresIn] - Expiration time (default: "1 hour")
   * @returns {Promise<Object>} { success, messageId?, error? }
   */
  async sendPasswordReset({ to, userName, resetLink, expiresIn }) {
    try {
      const provider = getEmailProvider();
      const { subject, html, text } = templates.passwordResetEmail({
        userName,
        resetLink,
        expiresIn
      });

      const result = await provider.sendEmail({ to, subject, html, text });

      if (result.success) {
        console.log(`✅ Sent password reset to ${to} (${result.provider})`);
      } else {
        console.error(`❌ Failed to send password reset to ${to}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Email service error (password reset):', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send custom email (advanced usage)
   *
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.subject - Email subject
   * @param {string} params.html - HTML content
   * @param {string} [params.text] - Plain text content
   * @param {string} [params.from] - Custom from address
   * @returns {Promise<Object>} { success, messageId?, error? }
   */
  async sendCustomEmail({ to, subject, html, text, from }) {
    try {
      const provider = getEmailProvider();
      const result = await provider.sendEmail({ to, subject, html, text, from });

      if (result.success) {
        console.log(`✅ Sent custom email to ${to} (${result.provider})`);
      } else {
        console.error(`❌ Failed to send custom email to ${to}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Email service error (custom email):', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify email service configuration
   *
   * @returns {Promise<boolean>} True if email service is properly configured
   */
  async verifyConfiguration() {
    try {
      const provider = getEmailProvider();
      return await provider.verifyConnection();
    } catch (error) {
      console.error('Email service verification failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
