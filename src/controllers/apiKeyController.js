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
    apiKey.hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    await apiKey.save();
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
