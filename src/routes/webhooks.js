import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// Mercado Pago webhook (sandbox-friendly minimal handler)
router.post('/mercadopago', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body || {};
    // TODO: validar firma cuando usemos producción (X-Signature / HMAC)
    // Extraer datos básicos si vienen
    const tenantId = event?.data?.tenantId || event?.metadata?.tenantId || null;
    const status = event?.data?.status || event?.type || null;

    if (tenantId && status) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { billingStatus: String(status) },
      }).catch(() => {});
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true }); // No romper reintentos del proveedor
  }
});

export default router;

