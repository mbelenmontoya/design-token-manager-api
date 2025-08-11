import express from 'express';
import {
  createApiKey,
  rotateApiKey,
  revokeApiKey,
} from '../controllers/apiKeyController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

/**
 * Routes for managing project-level API keys.
 *
 * These endpoints require an admin JWT in the `Authorization` header
 * (`Authorization: Bearer <jwt>`).  API keys provide non-JWT bearer access
 * to token routes and are scoped to a single project.  The raw key value is
 * only returned once on creation or rotation; store it securely.
 */

/**
 * Create a new API key.
 *
 * Authorization: `Bearer <jwt>`
 * Body:
 * ```json
 * { "scopes": ["read:tokens", "write:tokens"] }
 * ```
 * Example response:
 * ```json
 * { "apiKey": "<rawKey>", "id": "<keyId>" }
 * ```
 */
router.post('/', verifyJWT, tenantContext, requireRole(['admin']), createApiKey);

/**
 * Rotate an existing API key and receive a new raw key value.
 *
 * Authorization: `Bearer <jwt>`
 * Example response:
 * ```json
 * { "apiKey": "<newRawKey>" }
 * ```
 */
router.post(
  '/:id/rotate',
  verifyJWT,
  tenantContext,
  requireRole(['admin']),
  rotateApiKey
);

/**
 * Revoke an API key.
 *
 * Authorization: `Bearer <jwt>`
 * Example response:
 * ```json
 * { "message": "API key revoked" }
 * ```
 */
router.delete(
  '/:id',
  verifyJWT,
  tenantContext,
  requireRole(['admin']),
  revokeApiKey
);

export default router;
