import mongoose from 'mongoose';
import Tenant from '../../src/models/Tenant.js';
import Project from '../../src/models/Project.js';
import Membership from '../../src/models/Membership.js';
import User from '../../src/models/User.js';
import { post } from './httpClient.js';

export const uniqueName = (prefix) => `${prefix}-${Date.now()}-${Math.round(Math.random()*1e6)}`;

export async function loginAdmin() {
  const res = await post('/api/v1/auth/login', {
    body: { username: 'admin', password: 'Admin#123' }
  });
  if (res.status !== 200) {
    throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

export async function createTenantProjectForAdmin() {
  const tenant = await Tenant.create({ name: uniqueName('tenant') });
  const project = await Project.create({ name: uniqueName('proj'), tenant: tenant._id });
  const admin = await User.findOne({ username: 'admin' });
  await Membership.create({ user: admin._id, tenant: tenant._id, role: 'admin' });
  return { tenant, project };
}
