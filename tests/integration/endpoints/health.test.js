import { get } from '../../helpers/httpClient.js';

describe('Health', () => {
  it('reports database status from /status/database', async () => {
    const res = await get('/status/database');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('initialized');
    expect(res.body).toHaveProperty('configuration');
    expect(res.body).toHaveProperty('health');
    expect(res.body.health).toHaveProperty('read');
    expect(res.body.health).toHaveProperty('write');
  });

  it('reports postgres connectivity from /status/postgres', async () => {
    const res = await get('/status/postgres');
    // In local dev, postgres check should return 200 with ok true or 503 if misconfigured
    expect([200, 503]).toContain(res.status);
  });
});
