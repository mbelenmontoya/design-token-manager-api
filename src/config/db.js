import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  // Let mongoose throw if the connection fails so the process can exit
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
