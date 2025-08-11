import Membership from '../models/Membership.js';
import Project from '../models/Project.js';

export default async function tenantContext(req, res, next) {
  try {
    const tenantId = req.header('x-tenant-id');
    const projectId = req.header('x-project-id');
    if (!tenantId) {
      return res.status(403).json({ message: 'Tenant context required' });
    }
    if (!projectId) {
      return res.status(403).json({ message: 'Project context required' });
    }
    const membership = await Membership.findOne({ user: req.user.id, tenant: tenantId });
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.role = membership.role;
    req.tenantId = tenantId;
    const project = await Project.findOne({ _id: projectId, tenant: tenantId });
    if (!project) {
      return res.status(403).json({ message: 'Project not found in tenant' });
    }
    req.projectId = projectId;
    next();
  } catch (err) {
    next(err);
  }
}
