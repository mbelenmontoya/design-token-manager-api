import crypto from 'crypto';
import databaseService from '../dal/DatabaseService.js';
import emailService from '../services/email/EmailService.js';

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

    // Send invitation email
    const invitationLink = `${process.env.CLIENT_URL}/accept-invitation?token=${token}`;
    const emailResult = await emailService.sendTenantAdminInvitation({
      to: admin.email,
      adminName: admin.name,
      tenantName: tenant.name,
      invitationLink,
      expiresIn: '72 hours'
    });

    // Log email result but don't fail tenant creation if email fails
    if (!emailResult.success) {
      console.warn(`Tenant created but invitation email failed: ${emailResult.error}`);
    }

    res.status(201).json({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description,
      industry: tenant.industry,
      invitationSent: emailResult.success,
      adminEmail: admin.email
    });
  } catch (err) {
    next(err);
  }
}