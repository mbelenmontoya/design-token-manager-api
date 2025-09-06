import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import { listProjects, createProject } from '../controllers/projectController.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

// GET /api/v1/tenants/:tenantId/projects (org_admin: todos; otros: por ahora todos)
router.get('/tenants/:tenantId/projects', verifyJWT, tenantContext, listProjects);

// POST /api/v1/tenants/:tenantId/projects (org_admin solamente)
router.post('/tenants/:tenantId/projects', verifyJWT, tenantContext, requireRole(['org_admin']), createProject);

export default router;

