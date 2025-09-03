// Bootstrap Supabase with a tenant, project, user, and API key
// Usage: node scripts/bootstrapSupabase.js

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';
import { ApiScope } from '../src/generated/prisma/index.js';

const TENANT_NAME = process.env.BOOTSTRAP_TENANT_NAME || 'Acme Inc';
const PROJECT_NAME = process.env.BOOTSTRAP_PROJECT_NAME || 'Demo Project';
const ADMIN_USERNAME = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin@example.com';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin#123';

async function main() {
  console.log('🔧 Bootstrapping Supabase database...');

  // Ensure user
  let user = await prisma.user.findUnique({ where: { username: ADMIN_USERNAME } });
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
    user = await prisma.user.create({ data: { username: ADMIN_USERNAME, password: hash } });
    console.log('✅ Created user:', user.username);
  } else {
    console.log('ℹ️  User exists:', user.username);
  }

  // Ensure tenant
  let tenant = await prisma.tenant.findUnique({ where: { name: TENANT_NAME } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: TENANT_NAME } });
    console.log('✅ Created tenant:', tenant.name);
  } else {
    console.log('ℹ️  Tenant exists:', tenant.name);
  }

  // Ensure membership (admin)
  const existingMembership = await prisma.membership.findFirst({ where: { userId: user.id, tenantId: tenant.id } });
  if (!existingMembership) {
    await prisma.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: 'admin' } });
    console.log('✅ Added admin membership');
  } else {
    console.log('ℹ️  Admin membership exists');
  }

  // Ensure project
  let project = await prisma.project.findFirst({ where: { name: PROJECT_NAME, tenantId: tenant.id } });
  if (!project) {
    project = await prisma.project.create({ data: { name: PROJECT_NAME, tenantId: tenant.id } });
    console.log('✅ Created project:', project.name);
  } else {
    console.log('ℹ️  Project exists:', project.name);
  }

  // Create API key (always create a fresh one)
  const rawKey = 'dtm_ak_' + crypto.randomBytes(32).toString('hex');
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      hashedKey,
      scopes: [ApiScope.read_tokens, ApiScope.write_tokens],
      createdById: user.id,
    },
  });
  console.log('✅ Created API key');

  console.log('\n--- Bootstrap Summary ---');
  console.log('Tenant ID: ', tenant.id);
  console.log('Project ID:', project.id);
  console.log('Admin User:', user.username);
  console.log('API Key   :', rawKey);
  console.log('\nUse the API key with:');
  console.log('  Authorization: Bearer ' + rawKey);
  console.log('Optional headers (for extra safety):');
  console.log('  x-tenant-id: ' + tenant.id);
  console.log('  x-project-id: ' + project.id);
}

main()
  .catch((e) => {
    console.error('❌ Bootstrap error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
