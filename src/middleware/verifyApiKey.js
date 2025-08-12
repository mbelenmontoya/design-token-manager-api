import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';

const rateLimits = new Map();
const WINDOW_MS = 60 * 1000;

export default function verifyApiKey(requiredScope) {
  return async (req, res, next) => {
    const MAX_REQUESTS = parseInt(process.env.API_KEY_RATE_LIMIT, 10) || 60;
    const auth = req.header('Authorization');
    if (!auth) return next('route');
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) return next('route');
    // If token looks like a JWT (contains two dots), skip
    if (token.split('.').length === 3) return next('route');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const apiKey = await ApiKey.findOne({ hashedKey: hash, revoked: false });
    if (!apiKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    const headerTenant = req.header('x-tenant-id');
    const headerProject = req.header('x-project-id');
    if (
      (headerTenant && headerTenant !== apiKey.tenant_id.toString()) ||
      (headerProject && headerProject !== apiKey.project_id.toString())
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Rate limiting
    const now = Date.now();
    const keyId = apiKey._id.toString();
    const rl = rateLimits.get(keyId) || { count: 0, start: now };
    if (now - rl.start > WINDOW_MS) {
      rl.count = 1;
      rl.start = now;
    } else {
      rl.count += 1;
    }
    rateLimits.set(keyId, rl);
    if (rl.count > MAX_REQUESTS) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    apiKey.last_used_at = new Date();
    await apiKey.save();
    req.apiKey = apiKey;
    req.tenantId = apiKey.tenant_id.toString();
    req.projectId = apiKey.project_id.toString();
    next();
  };
}
