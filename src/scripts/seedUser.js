// scripts/seedUser.js
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();
await connectDB();

const exists = await User.findOne({ username: 'admin' });
if (!exists) {
  await User.create({ username: 'admin', password: 'Admin#123', role: 'admin' });
  console.log('✅ Admin user created: admin / Admin#123');
} else {
  console.log('ℹ️  Admin user already exists');
}
process.exit();
