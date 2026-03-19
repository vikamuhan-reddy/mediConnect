import express from 'express';
import jwt     from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  upload,
  transcribeAndSummarize,
  getSummary,
  getPatientHistory,
  getDoctorHistory,
} from '../controllers/consultationController.js';

const router     = express.Router();

router.post('/transcribe', authMiddleware, upload.single('audio'), transcribeAndSummarize);

router.get('/history/patient/:patientId', authMiddleware, getPatientHistory);

router.get('/history/doctor/:doctorId', authMiddleware, getDoctorHistory);

router.get('/:id', authMiddleware, getSummary);

export default router;