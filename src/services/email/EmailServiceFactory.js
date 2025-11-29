import { ConsoleEmailProvider } from './ConsoleEmailProvider.js';
import { SendGridEmailProvider } from './SendGridEmailProvider.js';
import { ResendEmailProvider } from './ResendEmailProvider.js';

/**
 * Email Service Factory
 *
 * Creates email provider instances based on environment configuration.
 * Supports multiple providers with fallback to console provider for development.
 *
 * Environment Variables:
 * - EMAIL_PROVIDER: Provider name (console, sendgrid, resend)
 * - EMAIL_FROM: Default sender email address
 * - SENDGRID_API_KEY: SendGrid API key (if using SendGrid)
 * - RESEND_API_KEY: Resend API key (if using Resend)
 */

let emailProviderInstance = null;

/**
 * Create email provider based on environment configuration
 *
 * @param {Object} options - Override options
 * @param {string} options.provider - Force specific provider
 * @param {string} options.apiKey - Override API key
 * @param {string} options.defaultFrom - Override default from address
 * @returns {EmailProvider} Email provider instance
 */
export function createEmailProvider(options = {}) {
  const providerName = options.provider || process.env.EMAIL_PROVIDER || 'console';
  const config = {
    apiKey: options.apiKey,
    defaultFrom: options.defaultFrom || process.env.EMAIL_FROM
  };

  switch (providerName.toLowerCase()) {
    case 'sendgrid':
      return new SendGridEmailProvider(config);

    case 'resend':
      return new ResendEmailProvider(config);

    case 'console':
    case 'development':
    case 'dev':
    default:
      if (providerName !== 'console' && providerName !== 'development' && providerName !== 'dev') {
        console.warn(`Unknown email provider "${providerName}", falling back to console provider`);
      }
      return new ConsoleEmailProvider(config);
  }
}

/**
 * Get singleton email provider instance
 *
 * @returns {EmailProvider} Email provider instance
 */
export function getEmailProvider() {
  if (!emailProviderInstance) {
    emailProviderInstance = createEmailProvider();
  }
  return emailProviderInstance;
}

/**
 * Reset email provider instance (useful for testing)
 */
export function resetEmailProvider() {
  emailProviderInstance = null;
}
