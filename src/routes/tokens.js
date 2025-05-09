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
import { importTokens } from '../controllers/importController.js';
const router = express.Router();

// ‣ GET   /api/tokens
// ‣ POST  /api/tokens
router
  .route('/')
  /**
 * @swagger
 * /api/tokens:
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
  .get(getTokens)  
/**
 * @swagger
 * /api/tokens:
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
    [
        body('name').isString().notEmpty(),
        body('value').isString().notEmpty(),
        body('category').isIn(['color','spacing','font','shadow','other']),
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

// ‣ PUT    /api/tokens/:id
// ‣ DELETE /api/tokens/:id
router
  .route('/:id')
  /**
 * @swagger
 * /api/tokens/{id}:
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
  .put(verifyJWT, updateToken)
  /**
 * @swagger
 * /api/tokens/{id}:
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
  .delete(verifyJWT, deleteToken);
  /**
 * @swagger
 * /api/tokens/import:
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
  router.post('/import', verifyJWT, importTokens);


export default router;
