import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], required: true },
  tokenHash: { type: String, required: true, unique: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
