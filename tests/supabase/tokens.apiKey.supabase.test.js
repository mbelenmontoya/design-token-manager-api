import { get, post } from '../helpers/httpClient.js';

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} for Supabase tests`);
  return v;
};

describe('Supabase: Tokens via API key', () => {
  const API_KEY = required('API_KEY');
  const TENANT_ID = required('TENANT_ID');
  const PROJECT_ID = required('PROJECT_ID');

  const headers = () => ({
    Authorization: `Bearer ${API_KEY}`,
    'x-tenant-id': TENANT_ID,
    'x-project-id': PROJECT_ID,
  });

  test('GET then POST then GET tokens', async () => {
    const list1 = await get('/api/v1/tokens', { headers: headers() });
    expect(list1.status).toBe(200);

    const name = 'jest-' + Date.now();
    const created = await post('/api/v1/tokens', {
      headers: headers(),
      body: { name, value: '#abcdef', category: 'color' },
    });
    expect(created.status).toBe(201);

    const list2 = await get('/api/v1/tokens', { headers: headers() });
    expect(list2.status).toBe(200);
  });
});

