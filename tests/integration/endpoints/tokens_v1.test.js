import { get, post, put, del } from '../../helpers/httpClient.js';
import { loginAdmin, createTenantProjectForAdmin, uniqueName } from '../../helpers/factories.js';

const authHeaders = (jwt, tenantId, projectId) => ({
  Authorization: `Bearer ${jwt}`,
  'x-tenant-id': tenantId.toString(),
  'x-project-id': projectId.toString(),
});

describe('Tokens v1', () => {
  let jwt;
  let tenant;
  let project;

  beforeAll(async () => {
    jwt = await loginAdmin();
    ({ tenant, project } = await createTenantProjectForAdmin());
  }, 60000); // Increased timeout for MongoDB connection buffering

  it('creates, reads, updates and deletes a token', async () => {
    const name = uniqueName('token');
    const headers = authHeaders(jwt, tenant._id, project._id);

    const createRes = await post('/api/v1/tokens', {
      headers,
      body: { name, value: '#fff' },
    });
    expect(createRes.status).toBe(201);
    const tokenId = createRes.body._id;

    const listRes = await get('/api/v1/tokens', { headers });
    expect(listRes.status).toBe(200);
    const found = listRes.body.tokens.find((t) => t._id === tokenId);
    expect(found).toBeTruthy();

    const updateRes = await put(`/api/v1/tokens/${tokenId}`, {
      headers,
      body: { name, value: '#000' },
    });
    expect(updateRes.status).toBe(200);

    const delRes = await del(`/api/v1/tokens/${tokenId}`, { headers });
    expect(delRes.status).toBe(200);
  });

  it('rejects unauthorized requests', async () => {
    const res = await post('/api/v1/tokens', { body: { name: 'x', value: '1' } });
    expect([401, 403]).toContain(res.status);
  });
});
