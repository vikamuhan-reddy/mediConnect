import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['patient', 'doctor', 'guardian'], required: true },
  phone:       { type: String, default: '' },
  guardian_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default mongoose.model('User', userSchema);