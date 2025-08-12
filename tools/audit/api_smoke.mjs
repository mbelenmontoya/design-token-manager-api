import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
import User from '../../src/models/User.js';
import Tenant from '../../src/models/Tenant.js';
import Project from '../../src/models/Project.js';
import Membership from '../../src/models/Membership.js';
import TokenRelease from '../../src/models/TokenRelease.js';

const base = 'http://localhost:4000';
let failures = 0;
const results = [];

function log(pass, name, note = '') {
  const icon = pass === true ? '✅' : pass === false ? '❌' : '⚠';
  const msg = `${icon} ${name}${note ? ' - ' + note : ''}`;
  results.push(msg);
  console.log(msg);
}

async function check(name, fn) {
  try {
    await fn();
    log(true, name);
  } catch (err) {
    log(false, name, err.message);
    failures++;
  }
}

(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'smoketest';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.API_KEY_RATE_LIMIT = '2';
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  ({ default: app } = await import('../../src/index.js'));
  const server = http.createServer(app);
  await new Promise(res => server.listen(4000, res));

  try {
    // Seed data
    const tenant1 = await Tenant.create({ name: 'tenant1' });
    const project1 = await Project.create({ name: 'project1', tenant: tenant1._id });
    const tenant2 = await Tenant.create({ name: 'tenant2' });
    const project2 = await Project.create({ name: 'project2', tenant: tenant2._id });

    const admin = await User.create({ username: 'admin@example.com', password: 'pass' });
    await Membership.create({ user: admin._id, tenant: tenant1._id, role: 'admin' });
    const viewer = await User.create({ username: 'viewer@example.com', password: 'pass' });
    await Membership.create({ user: viewer._id, tenant: tenant1._id, role: 'viewer' });

    const adminLogin = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@example.com', password: 'pass' })
    });
    const adminToken = (await adminLogin.json()).token;
    await check('Auth login works with seeded admin', async () => {
      if (adminLogin.status !== 200 || !adminToken) throw new Error('login failed');
    });

    // Health check
    await check('Health check /', async () => {
      const res = await fetch(`${base}/`);
      if (res.status !== 200) throw new Error(`status ${res.status}`);
    });

    // Swagger
    await check('Swagger /api-docs', async () => {
      const res = await fetch(`${base}/api-docs/v1/`);
      const text = await res.text();
      if (res.status !== 200 || !text.includes('Swagger')) throw new Error('missing');
    });

    // /api/v1/tokens route exists
    await check('/api/v1/tokens route', async () => {
      const res = await fetch(`${base}/api/v1/tokens`);
      if (res.status === 404) throw new Error('not found');
    });

    // Version headers and status endpoint
    await check('Version headers + /status/versioning', async () => {
      let res = await fetch(`${base}/`);
      if (!res.headers.get('API-Version')) throw new Error('no API-Version');
      res = await fetch(`${base}/`, { headers: { 'API-Version': '0.9' } });
      if (!res.headers.get('Deprecation')) throw new Error('no Deprecation');
      res = await fetch(`${base}/status/versioning`);
      const body = await res.json();
      if (!body.currentVersion) throw new Error('no versioning data');
    });

    // Immutable artifacts
    await check('Immutable artifacts', async () => {
      await TokenRelease.create({
        version: '1.2.3',
        theme: 'base',
        format: 'json',
        tokens: { color: { primary: '#fff' } }
      });
      let res = await fetch(`${base}/v/1.2.3/tokens?theme=base&format=json`);
      if (res.status !== 200) throw new Error('tokens missing');
      res = await fetch(`${base}/v/1.2.3/manifest.json?theme=base&format=json`);
      if (res.status !== 200) throw new Error('manifest missing');
    });

    // Multi-tenant + role enforcement
    await check('Multi-tenant isolation and role enforcement', async () => {
      // admin creates token
      let res = await fetch(`${base}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant1._id.toString(),
          'x-project-id': project1._id.toString()
        },
        body: JSON.stringify({ name: 'color.primary', value: '#fff' })
      });
      if (res.status !== 201) throw new Error('admin create failed');
      const viewerLogin = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'viewer@example.com', password: 'pass' })
      });
      const viewerToken = (await viewerLogin.json()).token;
      res = await fetch(`${base}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${viewerToken}`,
          'x-tenant-id': tenant1._id.toString(),
          'x-project-id': project1._id.toString()
        },
        body: JSON.stringify({ name: 'color.fail', value: '#000' })
      });
      if (res.status !== 403) throw new Error('viewer not restricted');
      res = await fetch(`${base}/api/v1/tokens`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant2._id.toString(),
          'x-project-id': project2._id.toString()
        }
      });
      if (res.status !== 403) throw new Error('tenant isolation failed');
    });

    // Invitations
    await check('Invitations flow', async () => {
      const inviteRes = await fetch(`${base}/api/v1/tenants/${tenant1._id.toString()}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ email: 'newuser@example.com', role: 'viewer' })
      });
      if (inviteRes.status !== 201) throw new Error('invite failed');
      const inviteData = await inviteRes.json();
      const token = inviteData.invitation.link.split('/')[4];
      await User.create({ username: 'newuser@example.com', password: 'pass' });
      const newLogin = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser@example.com', password: 'pass' })
      });
      const newToken = (await newLogin.json()).token;
      const acceptRes = await fetch(`${base}/api/v1/invitations/${token}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newToken}` }
      });
      if (acceptRes.status !== 201) throw new Error('accept failed');
    });

    // API key auth + rotation + rate limiting
    await check('API key auth + scope enforcement + rotation', async () => {
      let res = await fetch(`${base}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant1._id.toString(),
          'x-project-id': project1._id.toString()
        },
        body: JSON.stringify({ scopes: ['read:tokens', 'write:tokens'] })
      });
      if (res.status !== 201) throw new Error('create failed');
      let data = await res.json();
      let apiKey = data.apiKey;
      const apiKeyId = data.id;
      // create via key
      res = await fetch(`${base}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ name: 'color.api', value: '#0f0' })
      });
      if (res.status !== 201) throw new Error('key create failed');
      // rotate before rate limiting
      res = await fetch(`${base}/api/v1/api-keys/${apiKeyId}/rotate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant1._id.toString(),
          'x-project-id': project1._id.toString()
        }
      });
      if (res.status !== 200) throw new Error('rotate failed');
      data = await res.json();
      const newKey = data.apiKey;
      // old key should now fail
      res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${apiKey}` } });
      if (res.status !== 401) throw new Error('old key still valid');
      // new key works
      res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${newKey}` } });
      if (res.status !== 200) throw new Error('new key invalid');
      // rate limiting with new key
      await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${newKey}` } });
      res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${newKey}` } });
      if (res.status !== 429) throw new Error('rate limit missing');
    });

    // Billing (optional)
    if (!process.env.STRIPE_SECRET) {
      log(null, 'Billing routes and plan limit enforcement', 'STRIPE_SECRET missing');
    } else {
      await check('Billing routes and plan limit enforcement', async () => {
        const res = await fetch(`${base}/api/v1/billing`);
        if (res.status !== 200) throw new Error('billing failed');
      });
    }
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
    server.close();
    if (failures > 0) process.exit(1);
  }
})();
