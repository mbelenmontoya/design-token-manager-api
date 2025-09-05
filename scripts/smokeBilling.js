// Smoke test: billing summary and portal URL (admin JWT)
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#123';
const TENANT_ID = process.env.TENANT_ID;

async function request(method, path, { headers = {}, body } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, body: data };
}

async function login() {
  if (!ADMIN_USERNAME) {
    console.error('Missing ADMIN_USERNAME/ADMIN_USER in env');
    process.exit(1);
  }
  const res = await request('POST', '/api/v1/auth/login', { body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD } });
  if (res.status !== 200) {
    console.error('❌ Login failed', res.status, res.body);
    process.exit(1);
  }
  return res.body.token;
}

async function main() {
  if (!TENANT_ID) {
    console.error('Missing TENANT_ID in env');
    process.exit(1);
  }
  const jwt = await login();

  const sum = await request('GET', '/api/v1/billing/summary', {
    headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': TENANT_ID },
  });
  if (sum.status !== 200) {
    console.error('❌ GET billing/summary failed', sum.status, sum.body);
    process.exit(1);
  }
  console.log('✅ billing/summary:', sum.body);

  const portal = await request('GET', '/api/v1/billing/portal', {
    headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': TENANT_ID },
  });
  if (portal.status !== 200) {
    console.error('❌ GET billing/portal failed', portal.status, portal.body);
    process.exit(1);
  }
  console.log('✅ billing/portal:', portal.body);
}

main().catch((e) => { console.error('❌ Smoke billing error', e); process.exit(1); });

