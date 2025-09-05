import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import requireRole from '../middleware/requireRole.js';
import { getBillingPortal, getBillingSummary } from '../controllers/billingController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing and subscription management (admin-only)
 */

/**
 * @swagger
 * /api/v1/billing/summary:
 *   get:
 *     summary: Get tenant billing summary
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *     responses:
 *       200:
 *         description: Billing summary for the tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingSummary'
 */
router.get('/summary', verifyJWT, tenantContext, requireRole(['admin']), getBillingSummary);

/**
 * @swagger
 * /api/v1/billing/portal:
 *   get:
 *     summary: Get a redirect URL to the billing portal
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *     responses:
 *       200:
 *         description: One-time portal session URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingPortalResponse'
 */
router.get('/portal', verifyJWT, tenantContext, requireRole(['admin']), getBillingPortal);

export default router;

