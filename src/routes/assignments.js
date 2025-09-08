import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import { listAssignments, createAssignment, deleteAssignment } from '../controllers/projectAssignmentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/tenants/{tenantId}/projects/{projectId}/assignments:
 *   get:
 *     summary: List project assignments (org_admin only)
 *     tags: [Project Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of project assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectAssignment'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - org_admin required
 *   post:
 *     summary: Create project assignment (org_admin only)
 *     tags: [Project Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectAssignmentInput'
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectAssignment'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - org_admin required
 *       409:
 *         description: Conflict - assignment already exists
 */
router.get('/tenants/:tenantId/projects/:projectId/assignments', verifyJWT, tenantContext, listAssignments);
router.post('/tenants/:tenantId/projects/:projectId/assignments', verifyJWT, tenantContext, createAssignment);

/**
 * @swagger
 * /api/v1/tenants/{tenantId}/projects/{projectId}/assignments/{userId}:
 *   delete:
 *     summary: Delete project assignment (org_admin only)
 *     tags: [Project Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - org_admin required
 *       404:
 *         description: Assignment not found
 */
router.delete('/tenants/:tenantId/projects/:projectId/assignments/:userId', verifyJWT, tenantContext, deleteAssignment);

export default router;
