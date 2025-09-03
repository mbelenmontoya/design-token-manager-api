import crypto from 'crypto';
import databaseService from '../dal/DatabaseService.js';

export const listApiKeys = async (req, res, next) => {
  try {
    const keys = await databaseService.findApiKeysByProject(req.projectId);
    const sanitized = (keys || []).map((k) => ({
      id: k._id?.toString?.() || k.id,
      tenantId: k.tenant?._id?.toString?.() || k.tenant?.id || k.tenantId,
      projectId: k.project?._id?.toString?.() || k.project?.id || k.projectId,
      scopes: Array.isArray(k.scopes) ? k.scopes.map(s => String(s).replace(/_/g, ':')) : [],
      revoked: !!k.revoked,
      lastUsedAt: k.lastUsedAt || null,
      createdById: k.createdBy?._id?.toString?.() || k.createdBy?.id || k.createdById,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));
    res.json({ items: sanitized, total: sanitized.length });
  } catch (err) {
    next(err);
  }
};

export const createApiKey = async (req, res, next) => {
  try {
    const { scopes = [] } = req.body;
    const rawKey = crypto.randomBytes(32).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await databaseService.createApiKey({
      tenantId: req.tenantId,
      projectId: req.projectId,
      hashedKey,
      scopes,
      createdById: req.user.id,
    });
    res.status(201).json({ apiKey: rawKey, id: apiKey._id?.toString?.() || apiKey.id });
  } catch (err) {
    next(err);
  }
};

export const rotateApiKey = async (req, res, next) => {
  try {
    const apiKey = await databaseService.findApiKeyById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    // Validate scope to tenant/project
    const keyTenant = apiKey.tenant?._id?.toString?.() || apiKey.tenant?.id || apiKey.tenant || apiKey.tenantId;
    const keyProject = apiKey.project?._id?.toString?.() || apiKey.project?.id || apiKey.project || apiKey.projectId;
    if (String(keyTenant) !== String(req.tenantId) || String(keyProject) !== String(req.projectId) || apiKey.revoked) {
      return res.status(404).json({ message: 'API key not found' });
    }
    const rawKey = crypto.randomBytes(32).toString('hex');
    const newHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const id = apiKey._id?.toString?.() || apiKey.id;
    const updated = await databaseService.rotateApiKey(id, apiKey.hashedKey, newHash);
    if (!updated) {
      // Edge case: two rotate requests raced and a different hashedKey was already
      // persisted. Clients should retry to obtain the latest key.
      return res.status(409).json({ message: 'API key rotation conflict, retry' });
    }
    // At this point the DB has swapped the hash in a single operation, so the old
    // key remains valid only until the update commit. Concurrent rotations rely on
    // the conflict check above to avoid issuing multiple valid keys.
    res.json({ apiKey: rawKey });
  } catch (err) {
    next(err);
  }
};

export const revokeApiKey = async (req, res, next) => {
  try {
    const apiKey = await databaseService.findApiKeyById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    const keyTenant = apiKey.tenant?._id?.toString?.() || apiKey.tenant?.id || apiKey.tenant || apiKey.tenantId;
    const keyProject = apiKey.project?._id?.toString?.() || apiKey.project?.id || apiKey.project || apiKey.projectId;
    if (String(keyTenant) !== String(req.tenantId) || String(keyProject) !== String(req.projectId) || apiKey.revoked) {
      return res.status(404).json({ message: 'API key not found' });
    }
    await databaseService.updateApiKey(apiKey._id?.toString?.() || apiKey.id, { revoked: true });
    res.json({ message: 'API key revoked' });
  } catch (err) {
    next(err);
  }
};
