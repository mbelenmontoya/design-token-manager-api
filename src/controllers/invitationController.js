import crypto from 'crypto';
import databaseService from '../dal/DatabaseService.js';

export async function createInvitation(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { email, role } = req.body;
    // Verify requester is admin in the tenant via DAL
    const memberships = await databaseService.findMembershipsByUser(req.user.id);
    const isAdmin = memberships.some(m => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      return String(mTenant) === String(tenantId) && m.role === 'admin';
    });
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    const invitation = await databaseService.createInvitation({
      tenantId,
      email,
      role,
      tokenHash,
      inviterId: req.user.id,
      expiresAt
    });
    const id = invitation?._id?.toString?.() || invitation?.id;
    const link = `/api/v1/invitations/${token}/accept`;
    res.status(201).json({ invitation: { id, email, role, link } });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await databaseService.findInvitationByToken(tokenHash);
    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }
    if (invitation.acceptedAt || new Date(invitation.expiresAt) <= new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }
    const user = await databaseService.findUserById(req.user.id);
    if (!user || user.username !== invitation.email) {
      return res.status(403).json({ message: 'Email mismatch' });
    }
    // Check existing membership
    const existingMemberships = await databaseService.findMembershipsByUser(user.id || user._id);
    const hasMembership = existingMemberships.some(m => {
      const mTenant = m.tenant?._id?.toString?.() || m.tenant?.id || m.tenant || m.tenantId;
      return String(mTenant) === String(invitation.tenantId || invitation.tenant);
    });
    if (hasMembership) {
      return res.status(400).json({ message: 'Already a member' });
    }
    const membership = await databaseService.createMembership({
      userId: user.id || user._id?.toString?.(),
      tenantId: invitation.tenantId || invitation.tenant,
      role: invitation.role,
    });
    await databaseService.updateInvitation(invitation.id || invitation._id?.toString?.(), {
      acceptedAt: new Date(),
      acceptedById: user.id || user._id?.toString?.(),
    });
    res.status(201).json({ membership });
  } catch (err) {
    next(err);
  }
}
