const Prescription = require('../models/Prescription');
const Reminder = require('../models/Reminder');

const parseFrequency = (frequency) =>
  frequency.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ─────────────────────────────────────────────
// POST /api/prescriptions
// Doctor uploads a prescription WITH medicines list
// ─────────────────────────────────────────────
exports.createPrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      patientId,
      appointmentId,
      diagnosis,
      notes,
      medicines = [],   // array of { name, dosage, frequency, duration, instructions }
    } = req.body;

    const fileUrl = req.file ? req.file.path : null; // if using multer

    // 1. Save prescription
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      diagnosis,
      notes,
      fileUrl,
      medicines,
      remindersCreated: false,
    });

    // 2. Auto-create reminders from medicines list
    if (medicines && medicines.length > 0) {
      const reminderDocs = medicines.map((med) => ({
        userId: patientId,
        prescriptionId: prescription._id,
        medicineName: med.name,
        dosage: med.dosage,
        times: parseFrequency(med.frequency),
        startDate: new Date(),
        endDate: addDays(new Date(), Number(med.duration)),
        instructions: med.instructions || '',
        isActive: true,
      }));

      await Reminder.insertMany(reminderDocs);

      // Mark prescription as having reminders
      prescription.remindersCreated = true;
      await prescription.save();
    }

    res.status(201).json({
      success: true,
      message: 'Prescription saved and reminders created',
      prescription,
      remindersCreated: medicines.length,
    });
  } catch (err) {
    console.error('createPrescription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/prescriptions  — patient fetches their prescriptions
// ─────────────────────────────────────────────
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.json({ success: true, prescriptions });
  } catch (err) {
    console.error('getPatientPrescriptions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/prescriptions/doctor  — doctor fetches prescriptions they wrote
// ─────────────────────────────────────────────
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, prescriptions });
  } catch (err) {
    console.error('getDoctorPrescriptions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};