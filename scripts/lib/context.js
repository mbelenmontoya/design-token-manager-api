import { http } from './http.js';

export async function login() {
  const username = process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD || 'Admin#123';
  if (!username) throw new Error('Falta ADMIN_USERNAME/ADMIN_USER en entorno');
  const res = await http('POST', '/api/v1/auth/login', { body: { username, password } });
  if (res.status !== 200) throw new Error('Login falló: ' + JSON.stringify(res.body));
  return res.body.token;
}

export async function resolveTenantProject(jwt) {
  const envTenant = process.env.TENANT_ID;
  const envProject = process.env.PROJECT_ID;
  if (envTenant && envProject) return { tenantId: envTenant, projectId: envProject };

  const m = await http('GET', '/api/v1/users/me/memberships', { headers: { Authorization: `Bearer ${jwt}` } });
  if (m.status !== 200) throw new Error('No se pudo obtener memberships: ' + JSON.stringify(m.body));
  const first = m.body?.items?.[0];
  if (!first?.tenant?.id) throw new Error('No hay tenant disponible para el usuario');
  const tenantId = first.tenant.id;

  const pr = await http('GET', `/api/v1/tenants/${tenantId}/projects`, { headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId } });
  if (pr.status !== 200) throw new Error('No se pudo obtener projects: ' + JSON.stringify(pr.body));
  let project = pr.body?.items?.[0];
  if (!project) {
    const created = await http('POST', `/api/v1/tenants/${tenantId}/projects`, {
      headers: { Authorization: `Bearer ${jwt}`, 'x-tenant-id': tenantId },
      body: { name: 'Demo Project' },
    });
    if (created.status !== 201) throw new Error('No se pudo crear project: ' + JSON.stringify(created.body));
    project = created.body;
  }
  return { tenantId, projectId: project.id };
}
