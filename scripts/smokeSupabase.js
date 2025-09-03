// Simple Supabase smoke test for tokens endpoints
// Requires env: API_KEY, TENANT_ID, PROJECT_ID

import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

async function request(method, path, { headers = {}, body } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, body: data };
}

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const API_KEY = required('API_KEY');
  const TENANT_ID = required('TENANT_ID');
  const PROJECT_ID = required('PROJECT_ID');

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'x-tenant-id': TENANT_ID,
    'x-project-id': PROJECT_ID,
  };

  console.log('GET /api/v1/tokens');
  const list1 = await request('GET', '/api/v1/tokens', { headers });
  if (list1.status !== 200) {
    console.error('❌ GET tokens failed', list1.status, list1.body);
    process.exit(1);
  }
  console.log('✅ GET tokens OK:', list1.body.total ?? list1.body.tokens?.length ?? 'unknown');

  const tokenName = `smoke-${Date.now()}`;
  console.log('POST /api/v1/tokens');
  const create = await request('POST', '/api/v1/tokens', {
    headers,
    body: { name: tokenName, value: '#abcdef', category: 'color', description: 'smoke test' },
  });
  if (create.status !== 201) {
    console.error('❌ POST token failed', create.status, create.body);
    process.exit(1);
  }
  console.log('✅ POST token OK:', create.body.id || create.body._id);

  console.log('GET /api/v1/tokens (after create)');
  const list2 = await request('GET', '/api/v1/tokens', { headers });
  if (list2.status !== 200) {
    console.error('❌ GET tokens after create failed', list2.status, list2.body);
    process.exit(1);
  }
  console.log('✅ GET tokens OK:', list2.body.total ?? list2.body.tokens?.length ?? 'unknown');

  console.log('All smoke tests passed ✅');
}

main().catch((e) => {
  console.error('❌ Smoke test error', e);
  process.exit(1);
});

