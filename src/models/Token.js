import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'other',
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true, // adds createdAt & updatedAt
});

tokenSchema.index({ tenant: 1, project: 1, name: 1 }, { unique: true });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
