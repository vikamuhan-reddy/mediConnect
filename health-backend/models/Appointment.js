import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  doctor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  date:         { type: String, required: true },
  time:         { type: String, required: true },
  meeting_link: { type: String, default: '' },
  status:       { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);