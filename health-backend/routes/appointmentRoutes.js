const express   = require("express");
const router    = express.Router();
const { bookAppointment, getAppointments } = require("../controllers/appointmentController");

const verifyToken = require("../middleware/authMiddleware");

// POST /api/appointments  — book a new appointment
router.post("/", verifyToken, bookAppointment);

// GET  /api/appointments  — get appointments (filtered by role automatically)
router.get("/",  verifyToken, getAppointments);

module.exports = router;