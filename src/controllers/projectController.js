import databaseService from '../dal/DatabaseService.js';
import { ERR } from '../utils/errors.js';

export const listProjects = async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId;
    if (String(tenantId) !== String(req.tenantId)) return ERR.FORBIDDEN(res);
    const projects = await databaseService.findProjectsByTenant(tenantId);
    const items = (projects || []).map(p => ({ id: p.id || p._id?.toString?.(), name: p.name }));
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
};

export const createProject = async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId;
    if (String(tenantId) !== String(req.tenantId)) return ERR.FORBIDDEN(res);
    if (!req.body?.name) return ERR.VALIDATION(res, 'Project name is required');
    // Solo org_admin (DB: 'admin')
    if (req.role !== 'admin') return ERR.FORBIDDEN(res);
    const created = await databaseService.createProject({ tenantId, name: req.body.name });
    res.status(201).json({ id: created.id, name: created.name });
  } catch (err) { next(err); }
};

