// Smoke test: login and fetch current user's memberships
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
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
  const jwt = await login();
  const res = await request('GET', '/api/v1/users/me/memberships', { headers: { Authorization: `Bearer ${jwt}` } });
  if (res.status !== 200) {
    console.error('❌ GET me/memberships failed', res.status, res.body);
    process.exit(1);
  }
  const total = res.body?.total ?? (Array.isArray(res.body?.items) ? res.body.items.length : 'unknown');
  console.log('✅ GET me/memberships OK:', total);
}

main().catch((e) => { console.error('❌ Smoke memberships error', e); process.exit(1); });

