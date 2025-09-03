import bcrypt from 'bcryptjs';
import prisma from '../../src/config/prisma.js';
import { post, patch, del } from '../helpers/httpClient.js';

const getEnv = (name, fallback = undefined) => process.env[name] || fallback;
const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: Invitations and memberships', () => {
  const ADMIN_USERNAME = getEnv('ADMIN_USERNAME', 'admin@example.com');
  const ADMIN_PASSWORD = getEnv('ADMIN_PASSWORD', 'Admin#123');
  const TENANT_ID = required('TENANT_ID');

  const login = async (username, password) => {
    const res = await post('/api/v1/auth/login', { body: { username, password } });
    expect(res.status).toBe(200);
    return res.body.token;
  };

  const authHeaders = (jwt) => ({ Authorization: `Bearer ${jwt}` });

  test('invite, accept, update role, revoke', async () => {
    const adminJwt = await login(ADMIN_USERNAME, ADMIN_PASSWORD);

    const invitedEmail = `inv-${Date.now()}@example.com`;
    const inviteRes = await post(`/api/v1/tenants/${TENANT_ID}/invitations`, {
      headers: authHeaders(adminJwt),
      body: { email: invitedEmail, role: 'viewer' },
    });
    expect(inviteRes.status).toBe(201);
    const token = inviteRes.body.invitation.link.split('/').at(-2); // .../invitations/:token/accept

    // Create the invited user directly in DB
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Invited#123', salt);
    const user = await prisma.user.create({ data: { username: invitedEmail, password: hash } });

    const userJwt = await login(invitedEmail, 'Invited#123');

    const acceptRes = await post(`/api/v1/invitations/${token}/accept`, {
      headers: authHeaders(userJwt),
    });
    expect(acceptRes.status).toBe(201);
    const membershipId = acceptRes.body.membership.id || acceptRes.body.membership._id;

    const upd = await patch(`/api/v1/memberships/${membershipId}`, {
      headers: authHeaders(adminJwt),
      body: { role: 'editor' },
    });
    expect(upd.status).toBe(200);

    const rm = await del(`/api/v1/memberships/${membershipId}`, {
      headers: authHeaders(adminJwt),
    });
    expect(rm.status).toBe(200);

    // cleanup user
    await prisma.user.delete({ where: { id: user.id } });
  }, 30000);
});

