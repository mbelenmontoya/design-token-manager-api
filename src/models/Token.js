import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['color', 'spacing', 'font', 'shadow', 'other'],
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

const Token = mongoose.model('Token', tokenSchema);
export default Token;
