import { EmailProvider } from './EmailProvider.js';

/**
 * Console Email Provider
 *
 * Development-only email provider that logs emails to console instead of sending.
 * Useful for local development and testing without requiring real email service credentials.
 */
export class ConsoleEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.config = config;
    this.defaultFrom = config.defaultFrom || 'noreply@designtokens.local';
  }

  async sendEmail({ to, subject, html, text, from }) {
    const timestamp = new Date().toISOString();
    const messageId = `console-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL (Console Provider - Development Mode)');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Message ID: ${messageId}`);
    console.log(`From: ${from || this.defaultFrom}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(80));
    console.log('HTML Content:');
    console.log(html);
    if (text) {
      console.log('-'.repeat(80));
      console.log('Text Content:');
      console.log(text);
    }
    console.log('='.repeat(80) + '\n');

    return {
      success: true,
      messageId,
      provider: 'console'
    };
  }

  async verifyConnection() {
    console.log('✅ Console email provider: Ready (development mode)');
    return true;
  }

  getName() {
    return 'console';
  }
}
