// Smoke test: list API keys for current project (admin JWT)
import 'dotenv/config';
import { http } from './lib/http.js';
import { login, resolveTenantProject } from './lib/context.js';

async function main() {
  const jwt = await login();
  const { tenantId, projectId } = await resolveTenantProject(jwt);
  const res = await http('GET', '/api/v1/api-keys', {
    headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId, 'x-project-id': projectId },
  });
  if (res.status !== 200) {
    console.error('❌ GET api-keys failed', res.status, res.body);
    process.exit(1);
  }
  const total = res.body?.total ?? (Array.isArray(res.body?.items) ? res.body.items.length : 'unknown');
  console.log('✅ GET api-keys OK:', total);
}

main().catch((e) => { console.error('❌ Smoke api-keys list error', e); process.exit(1); });
