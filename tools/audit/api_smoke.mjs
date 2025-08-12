import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
const results = [];

function record(title, ok, severity = 'warn', error = '', skipped = false) {
  results.push({ title, ok, severity, error, skipped });
}

async function check(title, fn, severity = 'warn') {
  try {
    await fn();
    record(title, true, severity);
  } catch (err) {
    const msg = String(err);
    if (msg.startsWith('skip:')) {
      record(title, true, severity, msg.slice(5).trim(), true);
    } else {
      record(title, false, severity, msg);
    }
  }
}

(async () => {
  let adminToken;
  let tenant1, project1, tenant2, project2, viewerToken;

  await mongoose.connect(process.env.MONGO_URI);

  await check('Health', async () => {
    const res = await fetch(`${base}/health`);
    const body = await res.json().catch(() => ({}));
    if (res.status !== 200 || !body.ok) {
      throw new Error(`status ${res.status} body ${JSON.stringify(body).slice(0, 100)}`);
    }
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
    const res = await fetch(`${base}/health`);
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
      const db = mongoose.connection.db;
      const tenants = db.collection('tenants');
      const projects = db.collection('projects');
      const users = db.collection('users');
      const memberships = db.collection('memberships');
      tenant1 = (await tenants.insertOne({ name: 'audit-tenant1' })).insertedId;
      project1 = (await projects.insertOne({ name: 'audit-project1', tenant: tenant1 })).insertedId;
      tenant2 = (await tenants.insertOne({ name: 'audit-tenant2' })).insertedId;
      project2 = (await projects.insertOne({ name: 'audit-project2', tenant: tenant2 })).insertedId;
      const adminUser = await users.findOne({ username: 'admin' });
      const viewerHash = await bcrypt.hash('pass', 10);
      const viewerUser = (await users.insertOne({ username: 'audit-viewer', password: viewerHash })).insertedId;
      await memberships.insertMany([
        { user: adminUser._id, tenant: tenant1, role: 'admin' },
        { user: viewerUser, tenant: tenant1, role: 'viewer' }
      ]);
      const inviteeHash = await bcrypt.hash('pass', 10);
      await users.insertOne({ username: 'invitee', password: inviteeHash });
      viewerToken = await login('audit-viewer', 'pass');

      let res = await fetch(`${base}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant1.toString(),
          'x-project-id': project1.toString()
        },
        body: JSON.stringify({ name: 'color.admin', value: '#fff' })
      });
    if (res.status !== 201) throw new Error('admin create failed');

      res = await fetch(`${base}/api/v1/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${viewerToken}`,
          'x-tenant-id': tenant1.toString(),
          'x-project-id': project1.toString()
        },
        body: JSON.stringify({ name: 'color.viewer', value: '#000' })
      });
      if (res.status !== 403) throw new Error('viewer not blocked');

      res = await fetch(`${base}/api/v1/tokens`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${viewerToken}`,
          'x-tenant-id': tenant1.toString(),
          'x-project-id': project1.toString()
        }
      });
    if (res.status !== 200) throw new Error('viewer read failed');

      res = await fetch(`${base}/api/v1/tokens`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${viewerToken}`,
          'x-tenant-id': tenant2.toString(),
          'x-project-id': project2.toString()
        }
      });
      if (res.status !== 403) throw new Error('cross-tenant access allowed');
    });

    await check('Invitations flow', async () => {
      const resInvite = await fetch(`${base}/api/v1/tenants/${tenant1.toString()}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ email: 'invitee', role: 'viewer' })
      });
      if (resInvite.status !== 201) throw new Error('invite create failed');
      const invite = await resInvite.json();
      const match = invite.invitation.link.match(/invitations\/(.+)\/accept/);
      if (!match) throw new Error('no token');
      const token = match[1];
      const inviteeToken = await login('invitee', 'pass');
      const resAccept = await fetch(`${base}/api/v1/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inviteeToken}` }
      });
      if (resAccept.status !== 200) throw new Error('accept failed');
    });

  await check('API key auth + scope enforcement + rotation', async () => {
      let res = await fetch(`${base}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant1.toString(),
          'x-project-id': project1.toString()
        },
        body: JSON.stringify({ scopes: ['read:tokens'] })
      });
    if (res.status !== 200) throw new Error('create failed');
    const { apiKey } = await res.json();
    res = await fetch(`${base}/api/v1/tokens`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (res.status !== 200) throw new Error('key read failed');
      res = await fetch(`${base}/api/v1/api-keys/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-tenant-id': tenant1.toString(),
          'x-project-id': project1.toString()
        }
      });
    if (res.status !== 200) throw new Error('rotate failed');
    const { apiKey: newKey } = await res.json();
    res = await fetch(`${base}/api/v1/tokens`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.status !== 401) throw new Error('old key still works');
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
  console.log('## Smoke Tests');
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

async function login(username, password) {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.status !== 200) throw new Error(`status ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error('no token');
  return data.token;
}

