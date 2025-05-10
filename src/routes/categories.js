import express from 'express';
import { getCategories } from '../controllers/categoryController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/', verifyJWT, getCategories);

// Only admins (or same role logic) can add new categories
//router.post('/', verifyJWT, createCategory);

export default router;