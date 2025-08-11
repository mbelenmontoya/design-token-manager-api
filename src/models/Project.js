import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }
}, { timestamps: true });

projectSchema.index({ tenant: 1, name: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
