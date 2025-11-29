import { EmailProvider } from './EmailProvider.js';

/**
 * SendGrid Email Provider
 *
 * Production email provider using SendGrid API.
 * Requires SENDGRID_API_KEY environment variable.
 *
 * To use SendGrid:
 * 1. Sign up at https://sendgrid.com
 * 2. Create an API key in Settings > API Keys
 * 3. Set SENDGRID_API_KEY in .env
 * 4. Set EMAIL_PROVIDER=sendgrid in .env
 */
export class SendGridEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.SENDGRID_API_KEY;
    this.defaultFrom = config.defaultFrom || process.env.EMAIL_FROM || 'noreply@yourdomain.com';

    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
    }
  }

  async sendEmail({ to, subject, html, text, from }) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }]
          }],
          from: { email: from || this.defaultFrom },
          subject,
          content: [
            { type: 'text/html', value: html },
            ...(text ? [{ type: 'text/plain', value: text }] : [])
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
      }

      const messageId = response.headers.get('x-message-id');

      return {
        success: true,
        messageId,
        provider: 'sendgrid'
      };
    } catch (error) {
      console.error('SendGrid send error:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid'
      };
    }
  }

  async verifyConnection() {
    try {
      // Test API key by making a simple API call
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        console.log('✅ SendGrid email provider: Connected');
        return true;
      } else {
        console.warn('⚠️  SendGrid email provider: Invalid API key');
        return false;
      }
    } catch (error) {
      console.error('❌ SendGrid email provider: Connection failed', error.message);
      return false;
    }
  }

  getName() {
    return 'sendgrid';
  }
}
