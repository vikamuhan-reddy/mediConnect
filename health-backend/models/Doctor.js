import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  specialization: { type: String, required: true },
  language:       { type: String, default: 'English' },
  experience:     { type: Number, default: 0 },
  availability:   { type: String, default: 'Mon-Fri 9AM-5PM' },
  photo:          { type: String, default: '' },
  rating:         { type: Number, default: 0, min: 0, max: 5 },
  bio:            { type: String, default: '' },
  hospital:       { type: String, default: '' },
  fee:            { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);