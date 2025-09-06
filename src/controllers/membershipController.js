import databaseService from '../dal/DatabaseService.js';

export async function updateMembership(req, res, next) {
  try {
    const membership = await databaseService.findMembershipById(req.params.id);
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    const memberships = await databaseService.findMembershipsByUser(req.user.id);
    const isAdmin = memberships.some(m => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      const targetTenant = membership.tenant?._id?.toString?.() || membership.tenant?.id || membership.tenant || membership.tenantId;
      return String(mTenant) === String(targetTenant) && m.role === 'admin';
    });
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await databaseService.updateMembership(req.params.id, { role: req.body.role });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteMembership(req, res, next) {
  try {
    const membership = await databaseService.findMembershipById(req.params.id);
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    const memberships = await databaseService.findMembershipsByUser(req.user.id);
    const isAdmin = memberships.some(m => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      const targetTenant = membership.tenant?._id?.toString?.() || membership.tenant?.id || membership.tenant || membership.tenantId;
      return String(mTenant) === String(targetTenant) && m.role === 'admin';
    });
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await databaseService.deleteMembership(req.params.id);
    res.json({ message: 'Access revoked' });
  } catch (err) {
    next(err);
  }
}

export async function getMyMemberships(req, res, next) {
  try {
    const list = await databaseService.findMembershipsByUser(req.user.id);
    const items = (list || []).map((m) => {
      const role = m.role === 'admin' ? 'org_admin' : m.role;
      const tenantId = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenantId;
      const tenant = { id: tenantId, name: m.tenant?.name };
      const projects = Array.isArray(m.tenant?.projects)
        ? m.tenant.projects.map(p => ({ id: p.id || p._id?.toString?.(), name: p.name }))
        : undefined;
      return { tenant, role, ...(projects ? { projects } : {}) };
    });
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}
