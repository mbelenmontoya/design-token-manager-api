/**
 * @swagger
 * tags:
 *   name: Tokens
 *   description: Design token management
 */
import express from 'express';
import {
  getTokens,
  createToken,
  updateToken,
  deleteToken,
} from '../controllers/tokenController.js';
import { body, validationResult } from 'express-validator';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import requireRole from '../middleware/requireRole.js';
import { importTokens } from '../controllers/importController.js';
const router = express.Router();

// ‣ GET   /api/v1/tokens
// ‣ POST  /api/v1/tokens
router
  .route('/')
  /**
 * @swagger
 * /api/v1/tokens:
 *   get:
 *     summary: Get paginated list of tokens
 *     tags: [Tokens]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 20)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Paginated tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 tokens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Token'
 */
  .get(verifyJWT, tenantContext, getTokens)
/**
 * @swagger
 * /api/v1/tokens:
 *   post:
 *     summary: Create a new token
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenInput'
 *     responses:
 *       201:
 *         description: The created token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Token'
 *       400:
 *         description: Validation error
 */  
  .post(verifyJWT,
    tenantContext,
    requireRole(['admin','editor']),
    [
        body('name').isString().notEmpty(),
        body('value').isString().notEmpty(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).json({ errors: errors.array() });
        }
        next();
    },
    createToken
  );

// ‣ PUT    /api/v1/tokens/:id
// ‣ DELETE /api/v1/tokens/:id
router
  .route('/:id')
  /**
 * @swagger
 * /api/v1/tokens/{id}:
 *   put:
 *     summary: Update a token by ID
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenInput'
 *     responses:
 *       200:
 *         description: The updated token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Token'
 *       404:
 *         description: Token not found
 */
  .put(verifyJWT, tenantContext, requireRole(['admin','editor']), updateToken)
  /**
 * @swagger
 * /api/v1/tokens/{id}:
 *   delete:
 *     summary: Delete a token by ID
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The token ID
 *     responses:
 *       200:
 *         description: Token removed message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Token not found
 */
  .delete(verifyJWT, tenantContext, requireRole(['admin','editor']), deleteToken);
  /**
 * @swagger
 * /api/v1/tokens/import:
 *   post:
 *     summary: Bulk import or update tokens
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/TokenInput'
 *     responses:
 *       200:
 *         description: Import summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:
 *                   type: integer
 *                 updated:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       error:
 *                         type: string
 */
  router.post('/import', verifyJWT, tenantContext, requireRole(['admin','editor']), importTokens);


export default router;
