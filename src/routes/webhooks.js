import express from 'express';
import databaseService from '../dal/DatabaseService.js';
import { validateMercadoPagoWebhook } from '../utils/webhookValidation.js';

const router = express.Router();

/**
 * Mercado Pago webhook handler
 *
 * Processes billing status updates from Mercado Pago.
 * Signature validation is enforced when MERCADOPAGO_ENFORCE_SIGNATURE=true.
 *
 * @route POST /webhooks/mercadopago
 */
router.post(
  '/mercadopago',
  express.json({ type: 'application/json' }),
  validateMercadoPagoWebhook(),
  async (req, res) => {
    try {
      const event = req.body || {};

      // Extract tenant ID and status from webhook payload
      const tenantId = event?.data?.tenantId || event?.metadata?.tenantId || null;
      const status = event?.data?.status || event?.type || null;

      if (tenantId && status) {
        // Update tenant billing status using DAL
        const tenant = await databaseService.findTenantById(tenantId);

        if (tenant) {
          await databaseService.updateTenant(tenantId, {
            billingStatus: String(status)
          });

          console.log(`Webhook: Updated tenant ${tenantId} billing status to ${status}`);
        } else {
          console.warn(`Webhook: Tenant ${tenantId} not found`);
        }
      }

      // Always return 200 to prevent webhook retries
      res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Webhook processing error:', e.message);
      // Return 200 even on error to prevent provider retries
      res.status(200).json({ ok: true });
    }
  }
);

export default router;

