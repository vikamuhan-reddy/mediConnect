const express = require('express');
const router = express.Router();
const {
  getReminders,
  markTaken,
  createFromPrescription,
  deleteReminder,
} = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

// All routes require auth
router.use(protect);

router.get('/', getReminders);
router.post('/mark-taken', markTaken);
router.post('/from-prescription', createFromPrescription);
router.delete('/:id', deleteReminder);

module.exports = router;