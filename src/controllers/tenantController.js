import crypto from 'crypto';
import databaseService from '../dal/DatabaseService.js';

// POST /api/v1/tenants - create tenant with admin invitation
export async function createTenant(req, res, next) {
  try {
    const { name, description, industry, admin } = req.body;

    // Validate input
    if (!name || !admin?.name || !admin?.email) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, admin.name, admin.email' 
      });
    }

    // Check if tenant name already exists
    const existingTenant = await databaseService.readAdapter?.prisma?.tenant?.findUnique({
      where: { name }
    });
    
    if (existingTenant) {
      return res.status(409).json({ message: 'Tenant name already exists' });
    }

    // Create tenant
    const tenant = await databaseService.createTenant({
      name,
      description,
      industry
    });

    // Generate invitation token for admin
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 72); // 72 hours

    // Create tenant admin invitation
    await databaseService.createInvitation({
      tenantId: tenant.id,
      email: admin.email,
      adminName: admin.name,
      role: 'admin',
      tokenHash,
      isTenantCreation: true,
      expiresAt
    });

    // TODO: Send email with invitation link
    // const invitationLink = `${process.env.CLIENT_URL}/accept-invitation?token=${token}`;
    // await emailService.sendTenantAdminInvitation(admin.email, admin.name, tenant.name, invitationLink);

    res.status(201).json({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description,
      industry: tenant.industry,
      invitationSent: true,
      adminEmail: admin.email
    });
  } catch (err) {
    next(err);
  }
}