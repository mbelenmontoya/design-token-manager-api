import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], required: true }
}, { timestamps: true });

membershipSchema.index({ user: 1, tenant: 1 }, { unique: true });

const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
