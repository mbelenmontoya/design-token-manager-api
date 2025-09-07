import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import tenantContext from '../middleware/tenantContext.js';
import { listAssignments, createAssignment, deleteAssignment } from '../controllers/projectAssignmentController.js';

const router = express.Router();

router.get('/tenants/:tenantId/projects/:projectId/assignments', verifyJWT, tenantContext, listAssignments);
router.post('/tenants/:tenantId/projects/:projectId/assignments', verifyJWT, tenantContext, createAssignment);
router.delete('/tenants/:tenantId/projects/:projectId/assignments/:userId', verifyJWT, tenantContext, deleteAssignment);

export default router;
