// scripts/seedCategories.js
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';

dotenv.config();

const defaults = ['color','spacing','font','shadow','other'];

const seed = async () => {
  await connectDB();
  for (const name of defaults) {
    await Category.updateOne(
      { name },
      { name },
      { upsert: true }
    );
  }
  console.log('✅ Seeded categories');
  process.exit(0);
};

seed();
