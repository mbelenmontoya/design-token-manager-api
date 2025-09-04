import express from 'express';
import {
  listApiKeys,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
} from '../controllers/apiKeyController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: APIKeys
 *   description: Manage project-level API keys
 */

/**
 * Routes for managing project-level API keys.
 *
 * These endpoints require an admin JWT in the `Authorization` header
 * (`Authorization: Bearer <jwt>`).  API keys provide non-JWT bearer access
 * to token routes and are scoped to a single project.  The raw key value is
 * only returned once on creation or rotation; store it securely.
 */

/**
 * @swagger
 * /api/v1/api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [APIKeys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - $ref: '#/components/parameters/XProjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyRequest'
 *     responses:
 *       201:
 *         description: Created API key and raw value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyWithValue'
 */
router.post('/', verifyJWT, tenantContext, requireRole(['admin']), createApiKey);

/**
 * @swagger
 * /api/v1/api-keys:
 *   get:
 *     summary: List API keys for the current project
 *     tags: [APIKeys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantId'
 *       - $ref: '#/components/parameters/XProjectId'
 *     responses:
 *       200:
 *         description: API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 *                 total:
 *                   type: integer
 */
router.get('/', verifyJWT, tenantContext, requireRole(['admin']), listApiKeys);

/**
 * @swagger
 * /api/v1/api-keys/{id}/rotate:
 *   post:
 *     summary: Rotate an existing API key
 *     tags: [APIKeys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *       - $ref: '#/components/parameters/XTenantId'
 *       - $ref: '#/components/parameters/XProjectId'
 *     responses:
 *       200:
 *         description: New raw key value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyRotateResponse'
 *       409:
 *         description: Conflict if already rotated
 */
router.post(
  '/:id/rotate',
  verifyJWT,
  tenantContext,
  requireRole(['admin']),
  rotateApiKey
);

/**
 * @swagger
 * /api/v1/api-keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [APIKeys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *       - $ref: '#/components/parameters/XTenantId'
 *       - $ref: '#/components/parameters/XProjectId'
 *     responses:
 *       200:
 *         description: Confirmation message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete(
  '/:id',
  verifyJWT,
  tenantContext,
  requireRole(['admin']),
  revokeApiKey
);

export default router;
