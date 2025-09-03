// scripts/seedUser.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

try {
  await connectDB();
  
  // Wait for connection to be ready
  console.log('🔄 Waiting for database connection to be ready...');
  let retries = 0;
  while (mongoose.connection.readyState !== 1 && retries < 30) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    retries++;
  }
  
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection not ready after 30 seconds');
  }
  
  console.log('✅ Database connection ready, checking for admin user...');
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    await User.create({ username: 'admin', password: 'Admin#123' });
    console.log('✅ Admin user created: admin / Admin#123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }
} catch (error) {
  console.error('❌ Seed script error:', error.message);
  process.exit(1);
} finally {
  await mongoose.connection.close();
  process.exit();
}
