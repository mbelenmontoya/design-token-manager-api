import Membership from '../models/Membership.js';

export async function updateMembership(req, res, next) {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    const admin = await Membership.findOne({ tenant: membership.tenant, user: req.user.id, role: 'admin' });
    if (!admin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    membership.role = req.body.role;
    await membership.save();
    res.json(membership);
  } catch (err) {
    next(err);
  }
}

export async function deleteMembership(req, res, next) {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    const admin = await Membership.findOne({ tenant: membership.tenant, user: req.user.id, role: 'admin' });
    if (!admin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await membership.deleteOne();
    res.json({ message: 'Access revoked' });
  } catch (err) {
    next(err);
  }
}
