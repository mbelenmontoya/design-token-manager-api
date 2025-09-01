import databaseService from '../dal/DatabaseService.js';

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
    // Verify user membership in tenant via DAL
    const memberships = await databaseService.findMembershipsByUser(req.user.id);
    const membership = memberships.find(m => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      return mTenant && mTenant.toString() === tenantId;
    });
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.role = membership.role;
    req.tenantId = tenantId;

    // Verify project belongs to tenant via DAL
    const project = await databaseService.findProjectById(projectId);
    const projectTenant = project?.tenant?._id?.toString?.() || project?.tenant?.id || project?.tenantId;
    if (!project || !projectTenant || projectTenant.toString() !== tenantId) {
      return res.status(403).json({ message: 'Project not found in tenant' });
    }
    req.projectId = projectId;
    next();
  } catch (err) {
    next(err);
  }
}
