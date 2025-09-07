import 'dotenv/config';
import { http } from './lib/http.js';
import { login, resolveTenantProject } from './lib/context.js';

async function main() {
  const jwt = await login();
  const { tenantId, projectId } = await resolveTenantProject(jwt);
  // Crear asignación (al propio admin, como smoke mínimo)
  const me = await http('GET', '/api/v1/users/me/memberships', { headers: { Authorization: `Bearer ${jwt}` } });
  const userId = me.body?.items?.[0]?.user?.id || null;
  if (!userId) throw new Error('No se pudo resolver userId');

  let res = await http('POST', `/api/v1/tenants/${tenantId}/projects/${projectId}/assignments`, {
    headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId },
    body: { userId },
  });
  if (res.status !== 201 && res.status !== 422) {
    console.error('❌ create assignment', res.status, res.body);
    process.exit(1);
  }
  // Listar
  res = await http('GET', `/api/v1/tenants/${tenantId}/projects/${projectId}/assignments`, {
    headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId },
  });
  if (res.status !== 200) {
    console.error('❌ list assignments', res.status, res.body);
    process.exit(1);
  }
  console.log('assignments total', res.body?.total);
  // Borrar
  res = await http('DELETE', `/api/v1/tenants/${tenantId}/projects/${projectId}/assignments/${userId}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId },
  });
  if (![200,204,404].includes(res.status)) {
    console.error('❌ delete assignment', res.status, res.body);
    process.exit(1);
  }
  console.log('✅ assignments smoke OK');
}

main().catch((e) => { console.error('❌ Smoke assignments error', e); process.exit(1); });
