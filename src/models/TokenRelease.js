import mongoose from 'mongoose';
import crypto from 'crypto';

const tokenReleaseSchema = new mongoose.Schema({
  version: { type: String, required: true },
  theme: { type: String, required: true },
  format: { type: String, required: true },
  tokens: { type: mongoose.Schema.Types.Mixed, required: true },
  checksum: { type: String, required: true },
  date: { type: Date, default: Date.now },
  compatibility: { type: [String], default: [] },
}, { timestamps: true });

tokenReleaseSchema.index({ version: 1, theme: 1, format: 1 }, { unique: true });

tokenReleaseSchema.pre('validate', function(next) {
  if (this.isModified('tokens')) {
    const json = JSON.stringify(this.tokens);
    this.checksum = crypto.createHash('sha256').update(json).digest('hex');
  }
  next();
});

const TokenRelease = mongoose.model('TokenRelease', tokenReleaseSchema);
export default TokenRelease;
