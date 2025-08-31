import { get } from '../../helpers/httpClient.js';
import mongoose from 'mongoose';

describe('Debug Connection', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('should show MongoDB connection details', async () => {
    const mongoUri = process.env.MONGO_URI || global.__MONGO_URI__;
    console.log('MONGO_URI from env:', process.env.MONGO_URI);
    console.log('MONGO_URI from global:', global.__MONGO_URI__);
    console.log('Using MONGO_URI:', mongoUri);
    
    const healthRes = await get('/health');
    console.log('Health response:', JSON.stringify(healthRes.body, null, 2));
    
    expect(healthRes.status).toBe(200);
    
    // Try to connect directly
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
        });
        console.log('Direct connection successful');
        console.log('Connection ready state:', mongoose.connection.readyState);
        console.log('Connection host:', mongoose.connection.host);
      } catch (error) {
        console.error('Direct connection failed:', error.message);
      }
    } else {
      console.error('No MongoDB URI available');
    }
  }, 30000);
});