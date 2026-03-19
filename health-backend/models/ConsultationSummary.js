import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name:      { type: String, default: '' },
  dosage:    { type: String, default: '' },
  frequency: { type: String, default: '' },
}, { _id: false });

const consultationSummarySchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transcript: { type: String, required: true },
  summary:    { type: String, required: true }, // stored as JSON string
}, { timestamps: true });

export default mongoose.model('ConsultationSummary', consultationSummarySchema);