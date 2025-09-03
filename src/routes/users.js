import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import { getMyMemberships } from '../controllers/membershipController.js';

const router = express.Router();

// GET /api/v1/users/me/memberships
router.get('/me/memberships', verifyJWT, getMyMemberships);

export default router;

