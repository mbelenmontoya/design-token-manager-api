import jwt from 'jsonwebtoken';
import { ERR } from '../utils/errors.js';

export default function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return ERR.UNAUTHORIZED(res, 'No token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, iat, exp }
    next();
  } catch (err) {
    return ERR.UNAUTHORIZED(res, 'Invalid or expired token');
  }
}
