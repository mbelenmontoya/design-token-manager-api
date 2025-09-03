import crypto from 'crypto';
import databaseService from '../dal/DatabaseService.js';

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
    const apiKey = await databaseService.findApiKeyByHash(hash);
    if (!apiKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    const headerTenant = req.header('x-tenant-id');
    const headerProject = req.header('x-project-id');
    const keyTenant = apiKey.tenant?._id?.toString?.() || apiKey.tenant?.id || apiKey.tenant || apiKey.tenantId || apiKey.tenant_id?.toString?.();
    const keyProject = apiKey.project?._id?.toString?.() || apiKey.project?.id || apiKey.project || apiKey.projectId || apiKey.project_id?.toString?.();
    if (
      (headerTenant && headerTenant !== String(keyTenant)) ||
      (headerProject && headerProject !== String(keyProject))
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Rate limiting
    const now = Date.now();
    const keyId = apiKey._id?.toString?.() || apiKey.id;
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
    // Normalize enum scopes from Prisma (read_tokens) to API-style (read:tokens)
    const scopes = Array.isArray(apiKey.scopes) ? apiKey.scopes : [];
    const normScopes = scopes.map(s => (typeof s === 'string' ? s.replace(/_/g, ':') : s));
    if (requiredScope && !normScopes.includes(requiredScope)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Update last used time through DAL (best-effort)
    try {
      const id = apiKey._id?.toString?.() || apiKey.id;
      await databaseService.updateApiKey(id, { lastUsedAt: new Date() });
    } catch (_e) {
      // ignore non-fatal update errors
    }

    req.apiKey = apiKey;
    req.tenantId = String(keyTenant);
    req.projectId = String(keyProject);
    next();
  };
}
