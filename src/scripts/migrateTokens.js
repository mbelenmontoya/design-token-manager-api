import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Token from '../models/Token.js';
import Tenant from '../models/Tenant.js';
import Project from '../models/Project.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  let tenant = await Tenant.findOne({ name: 'default' });
  if (!tenant) tenant = await Tenant.create({ name: 'default' });
  let project = await Project.findOne({ name: 'default', tenant: tenant._id });
  if (!project) project = await Project.create({ name: 'default', tenant: tenant._id });
  await Token.updateMany({ tenant: { $exists: false } }, { tenant: tenant._id, project: project._id });
  console.log('Migration complete');
  await mongoose.disconnect();
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
