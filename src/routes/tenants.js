import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import databaseService from '../dal/DatabaseService.js';
import { ERR } from '../utils/errors.js';

const router = express.Router();

// GET /api/v1/tenants (platform_admin only)
router.get('/tenants', verifyJWT, async (req, res, next) => {
  try {
    if (!req.user?.platform) return ERR.FORBIDDEN(res);
    const prisma = databaseService.readAdapter?.prisma;
    const list = prisma?.tenant ? await prisma.tenant.findMany({ orderBy: { name: 'asc' } }) : [];
    const items = list.map(t => ({ id: t.id, name: t.name }));
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

export default router;
