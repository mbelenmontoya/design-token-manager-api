import { post } from './helpers/httpClient.js';

describe('Debug Auth', () => {
  it('should be able to login admin', async () => {
    const res = await post('/api/v1/auth/login', {
      body: { username: 'admin', password: 'Admin#123' }
    });
    
    console.log('Login response:', res.status, res.body);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  }, 120000); // 2 minute timeout
});