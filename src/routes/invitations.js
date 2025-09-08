import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import { 
  createInvitation, 
  acceptInvitation, 
  validateInvitation, 
  acceptTenantInvitation 
} from '../controllers/invitationController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/invitations/validate:
 *   post:
 *     summary: Validate invitation token
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['token']
 *             properties:
 *               token:
 *                 type: string
 *                 example: "abc123xyz"
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 adminName:
 *                   type: string
 *                 adminEmail:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Token expired or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/v1/invitations/accept:
 *   post:
 *     summary: Accept tenant admin invitation and create user
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['token', 'password']
 *             properties:
 *               token:
 *                 type: string
 *                 example: "abc123xyz"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "nuevapassword123"
 *     responses:
 *       200:
 *         description: Invitation accepted and user created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 role:
 *                   type: string
 *                   enum: ['admin']
 *                 token:
 *                   type: string
 *                   description: JWT token for immediate login
 *       400:
 *         description: Bad request - validation error or expired token
 *       409:
 *         description: User already exists with this email
 */

// POST /api/v1/invitations/validate (no auth required)
router.post('/invitations/validate', validateInvitation);

// POST /api/v1/invitations/accept (no auth required - creates user)
router.post('/invitations/accept', acceptTenantInvitation);

// Existing endpoints (require JWT)
router.post('/tenants/:tenantId/invitations', verifyJWT, createInvitation);
router.post('/invitations/:token/accept', verifyJWT, acceptInvitation);

export default router;
