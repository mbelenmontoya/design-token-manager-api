// Quick all-in-one smoke: status, memberships, api-keys list, tokens
import 'dotenv/config';
import { http } from './lib/http.js';
import { login as loginAdmin, resolveTenantProject } from './lib/context.js';

async function status() {
  const a = await http('GET', '/status/postgres');
  const b = await http('GET', '/status/database');
  console.log('status/postgres', a.status, a.body?.ok ?? a.body);
  console.log('status/database', b.status, b.body?.configuration ?? b.body);
  if (a.status !== 200) throw new Error('postgres status failed');
}

// usar helper de login de contexto

async function memberships(jwt) {
  const res = await http('GET', '/api/v1/users/me/memberships', { headers: { Authorization: `Bearer ${jwt}` } });
  if (res.status !== 200) throw new Error('memberships failed: ' + JSON.stringify(res.body));
  console.log('me/memberships OK', res.body?.total ?? res.body?.items?.length);
}

async function apiKeys(jwt, ctx) {
  const { tenantId, projectId } = ctx;
  const res = await http('GET', '/api/v1/api-keys', { headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId, 'x-project-id': projectId } });
  if (res.status !== 200) throw new Error('api-keys list failed: ' + JSON.stringify(res.body));
  console.log('api-keys list OK', res.body?.total ?? res.body?.items?.length);
}

async function tokens(jwt, ctx) {
  const { tenantId, projectId } = ctx;
  const headers = { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId, 'x-project-id': projectId };
  const list1 = await http('GET', '/api/v1/tokens', { headers });
  if (list1.status !== 200) throw new Error('GET tokens failed: ' + JSON.stringify(list1.body));
  const name = 'smoke-' + Date.now();
  const create = await http('POST', '/api/v1/tokens', { headers, body: { name, value: '#abcdef', category: 'color' } });
  if (create.status !== 201) throw new Error('POST token failed: ' + JSON.stringify(create.body));
  const tokenId = create.body?.id || create.body?._id;
  const upd = await http('PUT', `/api/v1/tokens/${tokenId}`, { headers, body: { description: 'updated' } });
  if (upd.status !== 200) throw new Error('PUT token failed: ' + JSON.stringify(upd.body));
  const del = await http('DELETE', `/api/v1/tokens/${tokenId}`, { headers });
  if (del.status !== 204) throw new Error('DELETE token failed: ' + JSON.stringify(del.body));
  console.log('tokens OK', tokenId);
}

async function main() {
  await status();
  const jwt = await loginAdmin();
  await memberships(jwt);
  const ctx = await resolveTenantProject(jwt);
  await apiKeys(jwt, ctx);
  // Billing opcional
  const sum = await http('GET', '/api/v1/billing/summary', { headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': ctx.tenantId } });
  if (sum.status !== 200) console.warn('billing summary skipped/failed', sum.status);
  await tokens(jwt, ctx);
  console.log('All smoke checks passed ✅');
}

main().catch((e) => { console.error('❌ Smoke all error', e); process.exit(1); });
