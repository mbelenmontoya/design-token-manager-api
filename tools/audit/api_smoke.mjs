import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Tenant from '../../src/models/Tenant.js';
import Project from '../../src/models/Project.js';
import Membership from '../../src/models/Membership.js';

const base = process.env.BASE_URL || 'http://localhost:4000';
const results = [];

async function check(title, fn, severity = 'warn') {
  try {
    await fn();
    results.push({ title, ok: true, severity });
  } catch (err) {
    const msg = String(err);
    if (msg.startsWith('skip:')) {
      results.push({ title, ok: true, skipped: true, severity, error: msg.slice(5).trim() });
    } else {
      results.push({ title, ok: false, severity, error: msg });
    }
  }
}

const login = async (username, password) => {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.status !== 200) throw new Error(`status ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error('no token');
  return data.token;
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (e) {
    results.push({ title: 'DB connection', ok: false, severity: 'critical', error: String(e) });
    outputAndExit();
    return;
  }

  let adminToken;
  let tenant1, project1, tenant2, project2, viewerToken;

  await check('Health /', async () => {
    const res = await fetch(`${base}/`);
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  }, 'critical');

  await check('Swagger /api-docs', async () => {
    const res = await fetch(`${base}/api-docs`);
    const text = await res.text();
    if (res.status !== 200 || !text.includes('Swagger')) throw new Error('missing');
  });

  await check('/api/v1/tokens route exists', async () => {
    const res = await fetch(`${base}/api/v1/tokens`);
    if (res.status === 404) throw new Error('not found');
  });

  await check('Version headers', async () => {
    const res = await fetch(`${base}/`);
    const v = res.headers.get('api-version');
    if (!v) throw new Error('missing API-Version');
    if (process.env.DEPRECATION_TOGGLE === 'on') {
      if (!res.headers.get('deprecation') || !res.headers.get('sunset') || !res.headers.get('link')) {
        throw new Error('missing deprecation headers');
      }
    }
  });

  await check('/status/versioning', async () => {
    const res = await fetch(`${base}/status/versioning`);
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    const body = await res.json();
    if (!body || !body.currentVersion) throw new Error('missing data');
  });

  await check('Immutable artifacts /v/1.0.0', async () => {
    const res = await fetch(`${base}/v/1.0.0/tokens?theme=base&format=json`);
    if (res.status === 404) throw new Error('skip: no release found');
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    const cc = res.headers.get('cache-control') || '';
    if (!cc.includes('immutable')) throw new Error('no immutable cache');
    if (!res.headers.get('etag')) throw new Error('no ETag');
    const res2 = await fetch(`${base}/v/1.0.0/manifest.json?theme=base&format=json`);
    if (res2.status !== 200) throw new Error(`manifest status ${res2.status}`);
    const manifest = await res2.json();
    if (!manifest.checksum || !manifest.date) throw new Error('manifest incomplete');
  });

  await check('Auth login works with seeded admin', async () => {
    adminToken = await login('admin', 'Admin#123');
  });

  await check('Multi-tenant isolation and role enforcement', async () => {
    tenant1 = await Tenant.create({ name: 'audit-tenant1' });
    project1 = await Project.create({ name: 'audit-project1', tenant: tenant1._id });
    tenant2 = await Tenant.create({ name: 'audit-tenant2' });
    project2 = await Project.create({ name: 'audit-project2', tenant: tenant2._id });
    const adminUser = await User.findOne({ username: 'admin' });
    const viewerUser = await User.create({ username: 'audit-viewer', password: 'pass' });
    await Membership.create({ user: adminUser._id, tenant: tenant1._id, role: 'admin' });
    await Membership.create({ user: viewerUser._id, tenant: tenant1._id, role: 'viewer' });
    viewerToken = await login('audit-viewer', 'pass');

    let res = await fetch(`${base}/api/v1/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-tenant-id': tenant1._id.toString(),
        'x-project-id': project1._id.toString()
      },
      body: JSON.stringify({ name: 'color.admin', value: '#fff' })
    });
    if (res.status !== 201) throw new Error('admin create failed');

    res = await fetch(`${base}/api/v1/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
        'x-tenant-id': tenant1._id.toString(),
        'x-project-id': project1._id.toString()
      },
      body: JSON.stringify({ name: 'color.viewer', value: '#000' })
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

  await check('Invitations flow', async () => {
    const inviteRes = await fetch(`${base}/api/v1/tenants/${tenant1._id}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ email: 'invitee@example.com', role: 'viewer' })
    });
    if (inviteRes.status !== 201) throw new Error('invite failed');
    const inviteData = await inviteRes.json();
    const token = inviteData.invitation.link.split('/').pop();
    await User.create({ username: 'invitee', password: 'pass' });
    const inviteeToken = await login('invitee', 'pass');
    const acceptRes = await fetch(`${base}/api/v1/invitations/${token}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${inviteeToken}` }
    });
    if (acceptRes.status !== 201) throw new Error('accept failed');
    let res = await fetch(`${base}/api/v1/tokens`, {
      headers: {
        Authorization: `Bearer ${inviteeToken}`,
        'x-tenant-id': tenant1._id.toString(),
        'x-project-id': project1._id.toString()
      }
    });
    if (res.status !== 200) throw new Error('invitee missing access');
    const invUser = await User.findOne({ username: 'invitee' });
    await Membership.deleteOne({ user: invUser._id, tenant: tenant1._id });
    res = await fetch(`${base}/api/v1/tokens`, {
      headers: {
        Authorization: `Bearer ${inviteeToken}`,
        'x-tenant-id': tenant1._id.toString(),
        'x-project-id': project1._id.toString()
      }
    });
    if (res.status !== 403) throw new Error('revoked user still has access');
  });

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
    const keyId = data.id;

    res = await fetch(`${base}/api/v1/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ name: 'color.key', value: '#0f0' })
    });
    if (res.status !== 201) throw new Error('key create failed');

    res = await fetch(`${base}/api/v1/api-keys/${keyId}/rotate`, {
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

    res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.status !== 401) throw new Error('old key still valid');

    res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${newKey}` } });
    if (res.status !== 200) throw new Error('new key invalid');

    await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${newKey}` } });
    res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${newKey}` } });
    if (res.status !== 429) throw new Error('rate limit missing');
  });

  await check('Billing routes and plan limit enforcement', async () => {
    if (process.env.SMOKE_STRIPE === 'skip') throw new Error('skip: missing Stripe config');
    const portal = await fetch(`${base}/api/v1/billing/portal`);
    if (portal.status === 404) throw new Error('portal missing');
    const webhook = await fetch(`${base}/api/v1/billing/webhook`, { method: 'POST' });
    if (webhook.status === 404) throw new Error('webhook missing');
  });

  await mongoose.disconnect();

  outputAndExit();
})();

function outputAndExit() {
  console.log('');
  console.log('| Check | Result |');
  console.log('| --- | --- |');
  for (const r of results) {
    const icon = r.ok ? (r.skipped ? '⚠' : '✅') : '❌';
    const msg = r.ok && !r.error ? '' : ` ${r.error || ''}`.trim();
    console.log(`| ${r.title} | ${icon}${msg ? ' - ' + msg : ''} |`);
  }
  const criticalFail = results.some(r => !r.ok && r.severity === 'critical');
  const warnFail = results.some(r => !r.ok && r.severity === 'warn');
  const passCount = results.filter(r => r.ok && !r.skipped).length;
  const failCount = results.filter(r => !r.ok).length;
  const skipCount = results.filter(r => r.skipped).length;
  console.log('');
  console.log(`Passed: ${passCount}, Failed: ${failCount}, Skipped: ${skipCount}`);
  if (criticalFail) process.exit(2);
  else if (warnFail) process.exit(1);
  else process.exit(0);
}

