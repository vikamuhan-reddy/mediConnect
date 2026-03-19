import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  dosage:       { type: String, required: true, trim: true },
  frequency:    { type: String, required: true },
  duration:     { type: Number, required: true },
  instructions: { type: String, default: '' },
});

const prescriptionSchema = new mongoose.Schema(
  {
    patientId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    diagnosis:        { type: String, default: '' },
    notes:            { type: String, default: '' },
    fileUrl:          { type: String, default: null },
    medicines:        [medicineSchema],
    remindersCreated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', prescriptionSchema);