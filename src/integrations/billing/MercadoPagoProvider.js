export default class MercadoPagoProvider {
  constructor({ returnUrl }) {
    this.returnUrl = returnUrl;
  }

  async getSummary(tenantId) {
    // Stubbed summary; adjust to Mercado Pago's data model when integrating
    return {
      provider: 'mercadopago',
      tenantId,
      plan: 'pro',
      status: 'active',
      currency: 'ars',
      amount: 19900,
      interval: 'month',
      currentPeriodEnd: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
      seats: { used: 3, limit: 10 },
      usage: { tokens: 1200 },
    };
  }

  async getPortalUrl(tenantId) {
    // Stubbed: Mercado Pago may require custom portal logic; return placeholder
    const url = `${this.returnUrl}/billing/portal?tenant=${encodeURIComponent(tenantId)}&provider=mercadopago`;
    return { url };
  }
}

