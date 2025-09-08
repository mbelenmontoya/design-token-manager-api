import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import { listProjects, createProject } from '../controllers/projectController.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/tenants/{tenantId}/projects:
 *   get:
 *     summary: List projects within a tenant
 *     description: org_admin sees all projects; editor/viewer see only assigned projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of projects (filtered by role and assignments)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       tenantId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a member of this tenant
 *   post:
 *     summary: Create a new project (org_admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name']
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - org_admin required
 */
// GET /api/v1/tenants/:tenantId/projects (org_admin: todos; editor/viewer: solo asignados)
router.get('/tenants/:tenantId/projects', verifyJWT, tenantContext, listProjects);

// POST /api/v1/tenants/:tenantId/projects (org_admin solamente)
router.post('/tenants/:tenantId/projects', verifyJWT, tenantContext, requireRole(['org_admin']), createProject);

export default router;

