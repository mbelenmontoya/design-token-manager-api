import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import { createInvitation, acceptInvitation } from '../controllers/invitationController.js';

const router = express.Router();

router.post('/tenants/:tenantId/invitations', verifyJWT, createInvitation);
router.post('/invitations/:token/accept', verifyJWT, acceptInvitation);

export default router;
