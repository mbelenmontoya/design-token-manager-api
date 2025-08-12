import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';

export const createApiKey = async (req, res, next) => {
  try {
    const { scopes = [] } = req.body;
    const rawKey = crypto.randomBytes(32).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await ApiKey.create({
      tenant_id: req.tenantId,
      project_id: req.projectId,
      hashedKey,
      scopes,
      created_by: req.user.id,
    });
    res.status(201).json({ apiKey: rawKey, id: apiKey._id });
  } catch (err) {
    next(err);
  }
};

export const rotateApiKey = async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      tenant_id: req.tenantId,
      project_id: req.projectId,
      revoked: false,
    });
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    const rawKey = crypto.randomBytes(32).toString('hex');
    const newHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    // Attempt an atomic rotation by including the previously fetched hashed key
    // in the update filter. If another rotation completes first, this update will
    // affect zero documents and we can surface a conflict to the caller.
    const updated = await ApiKey.findOneAndUpdate(
      {
        _id: apiKey._id,
        hashedKey: apiKey.hashedKey,
      },
      { hashedKey: newHash },
      { new: true }
    );
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
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      tenant_id: req.tenantId,
      project_id: req.projectId,
      revoked: false,
    });
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    apiKey.revoked = true;
    await apiKey.save();
    res.json({ message: 'API key revoked' });
  } catch (err) {
    next(err);
  }
};
