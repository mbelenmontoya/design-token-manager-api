/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate a user and return a JWT.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import databaseService from '../dal/DatabaseService.js';

const router = express.Router();

// @route  POST /api/v1/auth/login
// @desc   Authenticate & get token
// @access Public
router.post('/login', async (req, res, next) => {
    try {
      const { username: bodyUsername, password } = req.body;
      const user = await databaseService.findUserByUsername(bodyUsername);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      // sign a token with username and platform flag
      const id = user.id || user._id?.toString?.();
      const uname = user.username;
      const platform = !!user.platformAdmin;
      const token = jwt.sign(
        { id, username: uname, platform },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      res.json({ token });
    } catch (err) {
      next(err);
    }
  });
  
  export default router;
