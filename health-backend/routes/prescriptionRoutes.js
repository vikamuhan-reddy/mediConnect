const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createPrescription);                  // Doctor creates + auto-reminders
router.get('/', getPatientPrescriptions);              // Patient views their prescriptions
router.get('/doctor', getDoctorPrescriptions);         // Doctor views prescriptions they wrote

module.exports = router;