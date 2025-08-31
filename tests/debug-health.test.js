import { get } from './helpers/httpClient.js';

describe('Debug Health', () => {
  it('should show detailed health status', async () => {
    const res = await get('/health');
    
    console.log('Health response:', JSON.stringify(res.body, null, 2));
    
    expect(res.status).toBe(200);
  }, 30000);
});