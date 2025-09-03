import mongoose from 'mongoose';

describe('Debug MongoDB', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('should be able to connect to MongoDB directly', async () => {
    const mongoUri = process.env.MONGO_URI || global.__MONGO_URI__;
    console.log('MONGO_URI from env:', process.env.MONGO_URI);
    console.log('MONGO_URI from global:', global.__MONGO_URI__);
    console.log('Using MONGO_URI:', mongoUri);
    console.log('mongoose.connection.readyState before connect:', mongoose.connection.readyState);
    
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('Connected successfully');
      console.log('mongoose.connection.readyState after connect:', mongoose.connection.readyState);
      console.log('Connection host:', mongoose.connection.host);
    } catch (error) {
      console.error('Connection failed:', error.message);
      throw error;
    }
  }, 30000);
});