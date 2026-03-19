const Appointment = require("../models/Appointment");


// POST /api/appointments
const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, date, time } = req.body;

    if (!doctor_id || !date || !time) {
      return res.status(400).json({ message: "doctor_id, date, and time are required" });
    }

    // Auto-generate Jitsi video call link
    const meeting_link = `https://meet.jit.si/MediConnect-${Math.random().toString(36).substr(2, 8)}`;

    const appointment = await Appointment.create({
      doctor_id,
      patient_id: req.user.id,
      date,
      time,
      meeting_link
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/appointments
const getAppointments = async (req, res) => {
  try {
    let appointments;

    if (req.user.role === 'doctor') {
      // Doctor sees appointments where they are the doctor
      appointments = await Appointment.find({ doctor_id: req.user.id })
        .populate("patient_id", "name email phone")
        .sort({ date: 1 });
    } else if (req.user.role === 'guardian') {
      // Guardian sees appointments of their dependents
      const User = require("../models/User");
      const dependents = await User.find({ guardian_id: req.user.id }).select("_id");
      const dependentIds = dependents.map(d => d._id);
      appointments = await Appointment.find({ patient_id: { $in: dependentIds } })
        .populate("doctor_id",  "name specialization photo rating")
        .populate("patient_id", "name email")
        .sort({ date: 1 });
    } else {
      // Patient sees their own appointments
      appointments = await Appointment.find({ patient_id: req.user.id })
        .populate("doctor_id",  "name specialization photo rating")
        .populate("patient_id", "name email")
        .sort({ date: 1 });
    }

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { bookAppointment, getAppointments };