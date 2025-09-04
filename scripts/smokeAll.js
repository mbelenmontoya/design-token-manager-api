// Quick all-in-one smoke: status, memberships, api-keys list, tokens
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
const API_KEY = process.env.API_KEY;
const TENANT_ID = process.env.TENANT_ID;
const PROJECT_ID = process.env.PROJECT_ID;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#123';

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

async function status() {
  const a = await request('GET', '/status/postgres');
  const b = await request('GET', '/status/database');
  console.log('status/postgres', a.status, a.body?.ok ?? a.body);
  console.log('status/database', b.status, b.body?.configuration ?? b.body);
  if (a.status !== 200) throw new Error('postgres status failed');
}

async function login() {
  if (!ADMIN_USERNAME) throw new Error('Missing ADMIN_USERNAME/ADMIN_USER env');
  const res = await request('POST', '/api/v1/auth/login', { body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD } });
  if (res.status !== 200) throw new Error('Login failed: ' + JSON.stringify(res.body));
  return res.body.token;
}

async function memberships(jwt) {
  const res = await request('GET', '/api/v1/users/me/memberships', { headers: { Authorization: `Bearer ${jwt}` } });
  if (res.status !== 200) throw new Error('memberships failed: ' + JSON.stringify(res.body));
  console.log('me/memberships OK', res.body?.total ?? res.body?.items?.length);
}

async function apiKeys(jwt) {
  if (!TENANT_ID || !PROJECT_ID) throw new Error('Missing TENANT_ID/PROJECT_ID');
  const res = await request('GET', '/api/v1/api-keys', { headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': TENANT_ID, 'x-project-id': PROJECT_ID } });
  if (res.status !== 200) throw new Error('api-keys list failed: ' + JSON.stringify(res.body));
  console.log('api-keys list OK', res.body?.total ?? res.body?.items?.length);
}

async function tokens() {
  if (!API_KEY || !TENANT_ID || !PROJECT_ID) throw new Error('Missing API_KEY/TENANT_ID/PROJECT_ID');
  const headers = { Authorization: `Bearer ${API_KEY}`, 'x-tenant-id': TENANT_ID, 'x-project-id': PROJECT_ID };
  const list1 = await request('GET', '/api/v1/tokens', { headers });
  if (list1.status !== 200) throw new Error('GET tokens failed: ' + JSON.stringify(list1.body));
  const name = 'smoke-' + Date.now();
  const create = await request('POST', '/api/v1/tokens', { headers, body: { name, value: '#abcdef', category: 'color' } });
  if (create.status !== 201) throw new Error('POST token failed: ' + JSON.stringify(create.body));
  console.log('tokens OK', create.body?.id || create.body?._id);
}

async function main() {
  await status();
  const jwt = await login();
  await memberships(jwt);
  await apiKeys(jwt);
  await tokens();
  console.log('All smoke checks passed ✅');
}

main().catch((e) => { console.error('❌ Smoke all error', e); process.exit(1); });

