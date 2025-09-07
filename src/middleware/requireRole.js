import { ERR } from '../utils/errors.js';

// roles puede contener 'org_admin' que mapea a rol DB 'admin'
export default function requireRole(roles) {
  return (req, res, next) => {
    const normalized = roles.map((r) => (r === 'org_admin' ? 'admin' : r));
    if (!normalized.includes(req.role)) {
      return ERR.FORBIDDEN(res);
    }
    next();
  };
}
