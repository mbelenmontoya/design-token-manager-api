import { getBillingProviderName, getBillingReturnUrl } from '../../config/billing.js';
import StripeProvider from './StripeProvider.js';
import MercadoPagoProvider from './MercadoPagoProvider.js';

export function createBillingProvider() {
  const name = getBillingProviderName();
  const returnUrl = getBillingReturnUrl();
  switch (name) {
    case 'mercadopago':
    case 'mercado_pago':
    case 'mp':
      return new MercadoPagoProvider({ returnUrl });
    case 'stripe':
    default:
      return new StripeProvider({ returnUrl });
  }
}

