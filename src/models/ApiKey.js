import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  hashedKey: { type: String, required: true },
  scopes: [{ type: String, enum: ['read:tokens', 'write:tokens'] }],
  last_used_at: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('ApiKey', ApiKeySchema);
