import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    times: {
      type: [String],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    takenLog: [
      {
        date:  { type: String },
        time:  { type: String },
        taken: { type: Boolean, default: false },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

reminderSchema.virtual('todayStatus').get(function () {
  const today = new Date().toISOString().split('T')[0];
  return this.times.map((t) => {
    const log = this.takenLog.find((l) => l.date === today && l.time === t);
    return { time: t, taken: log ? log.taken : false };
  });
});

export default mongoose.model('Reminder', reminderSchema);