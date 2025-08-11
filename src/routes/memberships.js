import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import { updateMembership, deleteMembership } from '../controllers/membershipController.js';

const router = express.Router();

router.patch('/:id', verifyJWT, updateMembership);
router.delete('/:id', verifyJWT, deleteMembership);

export default router;
