import 'dotenv/config';
import { http } from './lib/http.js';
import { login, resolveTenantProject } from './lib/context.js';

function parseJwtUserId(token) {
  try {
    const [, payload] = token.split('.');
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return obj.id;
  } catch (_) {
    return null;
  }
}

async function main() {
  const jwt = await login();
  const { tenantId, projectId } = await resolveTenantProject(jwt);
  // Crear asignación (al propio usuario) tomando el id del JWT
  const userId = parseJwtUserId(jwt);
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
