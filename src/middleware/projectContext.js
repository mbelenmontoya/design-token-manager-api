import databaseService from '../dal/DatabaseService.js';
import { ERR } from '../utils/errors.js';

// Requiere tenant y project en headers
export default async function projectContext(req, res, next) {
  try {
    const tenantId = req.header('x-tenant-id');
    const projectId = req.header('x-project-id');
    if (!tenantId) return ERR.CONTEXT_REQUIRED(res, 'Tenant context required');
    if (!projectId) return ERR.CONTEXT_REQUIRED(res, 'Project context required');

    // Validar membresía del usuario en el tenant
    const memberships = await databaseService.findMembershipsByUser(req.user.id);
    const membership = memberships.find((m) => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      return mTenant && String(mTenant) === String(tenantId);
    });
    if (!membership) return ERR.FORBIDDEN(res);
    req.role = membership.role; // valores DB: 'admin' | 'editor' | 'viewer'
    req.tenantId = tenantId;

    // Validar proyecto pertenece al tenant
    const project = await databaseService.findProjectById(projectId);
    const projectTenant = project?.tenant?.id || project?.tenantId;
    if (!project || String(projectTenant) !== String(tenantId)) {
      return ERR.FORBIDDEN(res, 'Project not found in tenant');
    }
    req.projectId = projectId;
    next();
  } catch (err) {
    next(err);
  }
}

