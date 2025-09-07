// Smoke test: login and fetch current user's memberships
import 'dotenv/config';
import { http } from './lib/http.js';
import { login } from './lib/context.js';

async function main() {
  const jwt = await login();
  const res = await http('GET', '/api/v1/users/me/memberships', { headers: { Authorization: `Bearer ${jwt}` } });
  if (res.status !== 200) {
    console.error('❌ GET me/memberships failed', res.status, res.body);
    process.exit(1);
  }
  const total = res.body?.total ?? (Array.isArray(res.body?.items) ? res.body.items.length : 'unknown');
  console.log('✅ GET me/memberships OK:', total);
}

main().catch((e) => { console.error('❌ Smoke memberships error', e); process.exit(1); });
