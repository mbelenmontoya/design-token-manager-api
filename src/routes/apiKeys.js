import express from 'express';
import { createApiKey, rotateApiKey, revokeApiKey } from '../controllers/apiKeyController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.post('/', verifyJWT, tenantContext, requireRole(['admin']), createApiKey);
router.post('/:id/rotate', verifyJWT, tenantContext, requireRole(['admin']), rotateApiKey);
router.delete('/:id', verifyJWT, tenantContext, requireRole(['admin']), revokeApiKey);

export default router;
