import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

// POST /api/v1/invitations/validate - validate invitation token
export async function validateInvitation(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await databaseService.readAdapter?.prisma?.invitation?.findUnique({
      where: { tokenHash },
      include: { tenant: true }
    });

    if (!invitation) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Token expired or invalid' 
      });
    }

    if (invitation.acceptedAt || new Date(invitation.expiresAt) <= new Date()) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Token expired or invalid' 
      });
    }

    res.json({
      valid: true,
      tenant: {
        id: invitation.tenant.id,
        name: invitation.tenant.name
      },
      adminName: invitation.adminName,
      adminEmail: invitation.email,
      expiresAt: invitation.expiresAt.toISOString()
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/invitations/accept - accept tenant admin invitation
export async function acceptTenantInvitation(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        message: 'Token and password are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters' 
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await databaseService.readAdapter?.prisma?.invitation?.findUnique({
      where: { tokenHash },
      include: { tenant: true }
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    if (invitation.acceptedAt || new Date(invitation.expiresAt) <= new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    if (!invitation.isTenantCreation) {
      return res.status(400).json({ message: 'This endpoint is only for tenant creation invitations' });
    }

    // Check if user already exists
    const existingUser = await databaseService.readAdapter?.prisma?.user?.findUnique({
      where: { username: invitation.email }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await databaseService.readAdapter?.prisma?.user?.create({
      data: {
        username: invitation.email,
        password: hashedPassword
      }
    });

    // Create membership
    const membership = await databaseService.createMembership({
      userId: user.id,
      tenantId: invitation.tenantId,
      role: invitation.role
    });

    // Mark invitation as accepted
    await databaseService.readAdapter?.prisma?.invitation?.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        acceptedById: user.id
      }
    });

    // Generate JWT for immediate login
    const jwtToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        platform: user.platformAdmin || false
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.username,
        name: invitation.adminName
      },
      tenant: {
        id: invitation.tenant.id,
        name: invitation.tenant.name
      },
      role: invitation.role,
      token: jwtToken
    });
  } catch (err) {
    next(err);
  }
}

// Original acceptInvitation for existing user invitations (requires JWT)
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
