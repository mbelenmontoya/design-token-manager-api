import { EmailProvider } from './EmailProvider.js';

/**
 * Resend Email Provider
 *
 * Modern email provider using Resend API.
 * Requires RESEND_API_KEY environment variable.
 *
 * To use Resend:
 * 1. Sign up at https://resend.com
 * 2. Create an API key in Settings
 * 3. Set RESEND_API_KEY in .env
 * 4. Set EMAIL_PROVIDER=resend in .env
 */
export class ResendEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.RESEND_API_KEY;
    this.defaultFrom = config.defaultFrom || process.env.EMAIL_FROM || 'noreply@yourdomain.com';

    if (!this.apiKey) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
    }
  }

  async sendEmail({ to, subject, html, text, from }) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: from || this.defaultFrom,
          to: [to],
          subject,
          html,
          ...(text && { text })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status} - ${data.message || JSON.stringify(data)}`);
      }

      return {
        success: true,
        messageId: data.id,
        provider: 'resend'
      };
    } catch (error) {
      console.error('Resend send error:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'resend'
      };
    }
  }

  async verifyConnection() {
    try {
      // Resend doesn't have a dedicated health check endpoint
      // We verify by checking if the API key format is valid
      if (this.apiKey.startsWith('re_')) {
        console.log('✅ Resend email provider: API key format valid');
        return true;
      } else {
        console.warn('⚠️  Resend email provider: Invalid API key format');
        return false;
      }
    } catch (error) {
      console.error('❌ Resend email provider: Configuration error', error.message);
      return false;
    }
  }

  getName() {
    return 'resend';
  }
}
