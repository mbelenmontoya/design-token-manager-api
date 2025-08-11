import crypto from 'crypto';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';

export async function createInvitation(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { email, role } = req.body;
    const adminMembership = await Membership.findOne({ tenant: tenantId, user: req.user.id, role: 'admin' });
    if (!adminMembership) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    const invitation = await Invitation.create({
      tenant: tenantId,
      email,
      role,
      tokenHash,
      inviter: req.user.id,
      expiresAt
    });
    const link = `/api/invitations/${token}/accept`;
    res.status(201).json({ invitation: { id: invitation._id, email, role, link } });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await Invitation.findOne({ tokenHash, expiresAt: { $gt: new Date() }, acceptedAt: { $exists: false } });
    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }
    const user = await User.findById(req.user.id);
    if (user.username !== invitation.email) {
      return res.status(403).json({ message: 'Email mismatch' });
    }
    const existing = await Membership.findOne({ user: user._id, tenant: invitation.tenant });
    if (existing) {
      return res.status(400).json({ message: 'Already a member' });
    }
    const membership = await Membership.create({ user: user._id, tenant: invitation.tenant, role: invitation.role });
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();
    res.status(201).json({ membership });
  } catch (err) {
    next(err);
  }
}
