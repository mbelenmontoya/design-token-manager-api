import { get } from '../../helpers/httpClient.js';

describe('Health', () => {
  it('reports ok from /health', async () => {
    const res = await get('/health');
    
    // Health endpoint should always return 200 (endpoint is working)
    expect(res.status).toBe(200);
    
    // Response should have the expected structure
    expect(res.body).toHaveProperty('ok');
    expect(res.body).toHaveProperty('mongo');
    expect(res.body).toHaveProperty('dal');
    
    // MongoDB connection status
    expect(res.body.mongo).toHaveProperty('connected');
    
    // DAL should be present - check if it's in healthy or error state
    expect(res.body.dal).toBeDefined();
    expect(res.body.dal).toHaveProperty('configuration');
    
    // Check if DAL initialized successfully
    if (res.body.dal.read && res.body.dal.write) {
      // DAL is initialized - check full structure
      expect(res.body.dal).toHaveProperty('read');
      expect(res.body.dal).toHaveProperty('write');
      
      // In integration tests with MongoDB, should be healthy
      if (res.body.mongo.connected) {
        expect(res.body.ok).toBe(true);
        expect(res.body.dal.read.status).toBe('healthy');
        expect(res.body.dal.write.status).toBe('healthy');
      } else {
        expect(res.body.ok).toBe(false);
      }
    } else {
      // DAL failed to initialize - check error structure
      expect(res.body.dal).toHaveProperty('status');
      expect(res.body.dal).toHaveProperty('message');
      expect(res.body.ok).toBe(false);
      
      // Configuration should still be present even in error state
      expect(res.body.dal.configuration).toBeDefined();
    }
  });
  
  it('includes DAL configuration information', async () => {
    const res = await get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body.dal.configuration).toHaveProperty('reads');
    expect(res.body.dal.configuration).toHaveProperty('writes');
    
    // Configuration might be 'unknown' if DAL failed to initialize
    const validValues = ['mongo', 'supabase', 'dual', 'unknown'];
    expect(validValues).toContain(res.body.dal.configuration.reads);
    expect(validValues).toContain(res.body.dal.configuration.writes);
  });
});
