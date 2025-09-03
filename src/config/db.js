import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// In CI environments, enable buffering with very long timeout
mongoose.set('bufferCommands', true);
if (process.env.NODE_ENV === 'ci' || process.env.CI) {
  mongoose.set('bufferTimeoutMS', 60000); // 60 second buffer timeout for CI
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  
  try {
    // Add connection options for better reliability in CI
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout for server selection
      connectTimeoutMS: 20000, // 20 second connection timeout
      socketTimeoutMS: 60000, // 60 second socket timeout
      maxPoolSize: 10, // Connection pool size
      // Enable buffering with long timeouts for CI reliability
      bufferCommands: true,
      bufferTimeoutMS: 60000, // 60 second buffer timeout
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    throw err; // Re-throw the error so caller can handle it
  }
};

export default connectDB;
