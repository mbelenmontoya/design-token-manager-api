// Smoke test: list API keys for current project (admin JWT)
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#123';
const TENANT_ID = process.env.TENANT_ID;
const PROJECT_ID = process.env.PROJECT_ID;

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
  if (!TENANT_ID || !PROJECT_ID) {
    console.error('Missing TENANT_ID/PROJECT_ID in env');
    process.exit(1);
  }
  const jwt = await login();
  const res = await request('GET', '/api/v1/api-keys', {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'x-tenant-id': TENANT_ID,
      'x-project-id': PROJECT_ID,
    },
  });
  if (res.status !== 200) {
    console.error('❌ GET api-keys failed', res.status, res.body);
    process.exit(1);
  }
  const total = res.body?.total ?? (Array.isArray(res.body?.items) ? res.body.items.length : 'unknown');
  console.log('✅ GET api-keys OK:', total);
}

main().catch((e) => { console.error('❌ Smoke api-keys list error', e); process.exit(1); });

