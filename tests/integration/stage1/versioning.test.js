import { get } from '../../helpers/httpClient.js';

describe('Versioning', () => {
  it('tokens endpoint exists and sends API-Version header', async () => {
    const res = await get('/api/v1/tokens');
    expect([200, 401]).toContain(res.status);
    expect(res.headers.get('api-version')).toBeDefined();
  });

  it('reports supported versions', async () => {
    const res = await get('/status/versioning');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.supportedVersions)).toBe(true);
  });
});
