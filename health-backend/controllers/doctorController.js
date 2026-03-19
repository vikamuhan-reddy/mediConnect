const Doctor = require("../models/Doctor");


// GET /api/doctors
const getDoctors = async (req, res) => {
  try {
    const filter = {};
    if (req.query.specialization) filter.specialization = req.query.specialization;
    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDoctors, getDoctorById };