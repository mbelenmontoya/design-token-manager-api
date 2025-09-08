import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import databaseService from '../dal/DatabaseService.js';
import { ERR } from '../utils/errors.js';
import { createTenant } from '../controllers/tenantController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: List all tenants (platform admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - platform admin required
 *   post:
 *     summary: Create tenant with admin invitation (platform admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name', 'admin']
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corp"
 *               description:
 *                 type: string
 *                 example: "Empresa de tecnología"
 *               industry:
 *                 type: string
 *                 example: "technology"
 *               admin:
 *                 type: object
 *                 required: ['name', 'email']
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "juan@acmecorp.com"
 *     responses:
 *       201:
 *         description: Tenant created and invitation sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 industry:
 *                   type: string
 *                 invitationSent:
 *                   type: boolean
 *                 adminEmail:
 *                   type: string
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - platform admin required
 *       409:
 *         description: Tenant name already exists
 */
// GET /api/v1/tenants (platform_admin only)
router.get('/tenants', verifyJWT, async (req, res, next) => {
  try {
    if (!req.user?.platform) return ERR.FORBIDDEN(res);
    const prisma = databaseService.readAdapter?.prisma;
    const list = prisma?.tenant ? await prisma.tenant.findMany({ orderBy: { name: 'asc' } }) : [];
    const items = list.map(t => ({ 
      id: t.id, 
      name: t.name, 
      description: t.description,
      industry: t.industry,
      createdAt: t.createdAt
    }));
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// POST /api/v1/tenants (platform_admin only)
router.post('/tenants', verifyJWT, async (req, res, next) => {
  try {
    if (!req.user?.platform) return ERR.FORBIDDEN(res);
    return createTenant(req, res, next);
  } catch (err) { next(err); }
});

export default router;
