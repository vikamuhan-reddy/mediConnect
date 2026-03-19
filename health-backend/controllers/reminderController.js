const Reminder = require('../models/Reminder');

// Helper: parse frequency string → array of time labels
const parseFrequency = (frequency) => {
  return frequency
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
};

// Helper: add N days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ─────────────────────────────────────────────
// GET /api/reminders  — all reminders for logged-in patient
// ─────────────────────────────────────────────
exports.getReminders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = await Reminder.find({
      userId: req.user.id,
      isActive: true,
      endDate: { $gte: today }, // only current / future
    })
      .sort({ createdAt: -1 })
      .populate('prescriptionId', 'diagnosis doctorId')
      .lean();

    // Attach todayStatus manually (since we used .lean())
    const todayStr = new Date().toISOString().split('T')[0];
    const enriched = reminders.map((r) => ({
      ...r,
      todayStatus: r.times.map((t) => {
        const log = (r.takenLog || []).find(
          (l) => l.date === todayStr && l.time === t
        );
        return { time: t, taken: log ? log.taken : false };
      }),
    }));

    res.json({ success: true, reminders: enriched });
  } catch (err) {
    console.error('getReminders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/reminders/mark-taken
// body: { reminderId, time, date? }
// ─────────────────────────────────────────────
exports.markTaken = async (req, res) => {
  try {
    const { reminderId, time, date } = req.body;
    const todayStr = date || new Date().toISOString().split('T')[0];

    const reminder = await Reminder.findOne({
      _id: reminderId,
      userId: req.user.id,
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    // Update or insert log entry
    const existingIdx = reminder.takenLog.findIndex(
      (l) => l.date === todayStr && l.time === time
    );

    if (existingIdx >= 0) {
      reminder.takenLog[existingIdx].taken = true;
    } else {
      reminder.takenLog.push({ date: todayStr, time, taken: true });
    }

    await reminder.save();
    res.json({ success: true, message: 'Marked as taken' });
  } catch (err) {
    console.error('markTaken error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/reminders/from-prescription
// Called internally or by doctor after uploading prescription
// body: { prescriptionId, patientId, medicines: [...] }
// ─────────────────────────────────────────────
exports.createFromPrescription = async (req, res) => {
  try {
    const { prescriptionId, patientId, medicines } = req.body;

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'No medicines provided' });
    }

    const createdReminders = [];

    for (const med of medicines) {
      const reminder = await Reminder.create({
        userId: patientId,
        prescriptionId: prescriptionId || null,
        medicineName: med.name,
        dosage: med.dosage,
        times: parseFrequency(med.frequency),
        startDate: new Date(),
        endDate: addDays(new Date(), med.duration),
        instructions: med.instructions || '',
        isActive: true,
      });
      createdReminders.push(reminder);
    }

    res.status(201).json({
      success: true,
      message: `${createdReminders.length} reminder(s) created`,
      reminders: createdReminders,
    });
  } catch (err) {
    console.error('createFromPrescription error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/reminders/:id  — deactivate a reminder
// ─────────────────────────────────────────────
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({ success: true, message: 'Reminder removed' });
  } catch (err) {
    console.error('deleteReminder error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};