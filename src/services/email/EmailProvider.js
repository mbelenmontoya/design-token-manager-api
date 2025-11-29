/**
 * Email Provider Interface
 *
 * Base interface that all email providers must implement.
 * Ensures consistent API across different email service providers.
 */
export class EmailProvider {
  /**
   * Send an email
   *
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.subject - Email subject line
   * @param {string} params.html - HTML email content
   * @param {string} [params.text] - Plain text email content (fallback)
   * @param {string} [params.from] - Sender email address (optional, uses default)
   * @returns {Promise<Object>} { success: boolean, messageId?: string, error?: string }
   */
  async sendEmail({ to, subject, html, text, from }) {
    throw new Error('sendEmail() must be implemented by provider');
  }

  /**
   * Verify provider configuration
   *
   * @returns {Promise<boolean>} True if provider is properly configured
   */
  async verifyConnection() {
    throw new Error('verifyConnection() must be implemented by provider');
  }

  /**
   * Get provider name
   *
   * @returns {string} Provider name (e.g., 'sendgrid', 'ses', 'resend')
   */
  getName() {
    throw new Error('getName() must be implemented by provider');
  }
}
