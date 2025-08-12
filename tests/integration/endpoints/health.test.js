import { get } from '../../helpers/httpClient.js';

describe('Health', () => {
  it('reports ok from /health', async () => {
    const res = await get('/health');
    if (res.status !== 200) {
      throw new Error(`Health check failed: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.ok).toBe(true);
    expect(res.body.mongo.connected).toBe(true);
  });
});
