export default class StripeProvider {
  constructor({ returnUrl }) {
    this.returnUrl = returnUrl;
  }

  async getSummary(tenantId) {
    // Stubbed summary; replace with real Stripe API calls when keys are configured
    return {
      provider: 'stripe',
      tenantId,
      plan: 'pro',
      status: 'active',
      currency: 'usd',
      amount: 4900,
      interval: 'month',
      currentPeriodEnd: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
      seats: { used: 3, limit: 10 },
      usage: { tokens: 1200 },
    };
  }

  async getPortalUrl(tenantId) {
    // Stubbed URL; replace with Stripe Billing Portal session URL
    const url = `${this.returnUrl}/billing/portal?tenant=${encodeURIComponent(tenantId)}&provider=stripe`;
    return { url };
  }
}

