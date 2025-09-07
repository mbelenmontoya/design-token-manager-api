import databaseService from '../dal/DatabaseService.js';
import { ERR } from '../utils/errors.js';

export default async function tenantContext(req, res, next) {
  try {
    const tenantId = req.header('x-tenant-id');
    if (!tenantId) return ERR.CONTEXT_REQUIRED(res, 'Tenant context required');
    if (req.user?.platform) {
      // Platform admin: bypass membership, treat as admin for this scope
      req.role = 'admin';
      req.tenantId = tenantId;
      return next();
    }
    const memberships = await databaseService.findMembershipsByUser(req.user.id);
    const membership = memberships.find((m) => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      return mTenant && String(mTenant) === String(tenantId);
    });
    if (!membership) return ERR.FORBIDDEN(res);
    req.role = membership.role;
    req.tenantId = tenantId;
    next();
  } catch (err) {
    next(err);
  }
}
