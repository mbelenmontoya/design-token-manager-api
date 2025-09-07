import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import { getMyMemberships } from '../controllers/membershipController.js';

const router = express.Router();

// GET /api/v1/users/me
router.get('/me', verifyJWT, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

/**
 * @swagger
 * /api/v1/users/me/memberships:
 *   get:
 *     summary: List memberships for the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memberships for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MembershipItem'
 *                 total:
 *                   type: integer
 */
// GET /api/v1/users/me/memberships
router.get('/me/memberships', verifyJWT, getMyMemberships);

export default router;
