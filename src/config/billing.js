export function getBillingProviderName() {
  return (process.env.BILLING_PROVIDER || 'stripe').toLowerCase();
}

export function getBillingReturnUrl() {
  return process.env.BILLING_PORTAL_RETURN_URL || process.env.CLIENT_URL || 'http://localhost:5173';
}

