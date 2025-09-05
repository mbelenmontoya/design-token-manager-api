import { createBillingProvider } from '../integrations/billing/BillingFactory.js';

export const getBillingSummary = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const provider = createBillingProvider();
    const summary = await provider.getSummary(tenantId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getBillingPortal = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const provider = createBillingProvider();
    const { url } = await provider.getPortalUrl(tenantId);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};

