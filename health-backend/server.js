console.log('[MC] server.js loaded — MongoDB version');
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import multer from 'multer';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import fs from 'fs';
import { createRequire } from 'module';
import Reminder     from './models/Reminder.js';      // ← ADD
import Prescription from './models/Prescription.js';  // ← ADD

import consultationRoutes from './routes/consultationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import prescriptionScanRoute from './routes/prescriptionScanRoute.js';






const JWT_SECRET = process.env.JWT_SECRET || 'mediconnect-secret-key';
const PORT       = process.env.PORT || 3000;
const MONGO_URI  = process.env.MONGO_URI;


// ── Mongoose Models ────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  username:       { type: String, required: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  phone:          { type: String, default: null },
  role:           { type: String, enum: ['patient', 'doctor', 'guardian'], default: 'patient' },
  guardian_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Doctor-specific fields
  specialization: { type: String, default: null },
  hospital:       { type: String, default: null },
  experience:     { type: Number, default: 0 },
  fee:            { type: Number, default: 0 },
  rating:         { type: Number, default: 0 },
  availability:   { type: String, default: 'Mon-Fri' },
  bio:            { type: String, default: '' },
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booked_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor_id:    { type: String, required: true },
  date:         { type: String, required: true },
  time:         { type: String, required: true },
  status:       { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  meeting_link: { type: String },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  type:       { type: String, default: 'general' },
  request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LinkRequest', default: null },
  read:       { type: Boolean, default: false },
  resolved:   { type: Boolean, default: false },
}, { timestamps: true });

const linkRequestSchema = new mongoose.Schema({
  guardian_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guardian_name:  { type: String },
  guardian_email: { type: String },
  patient_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient_email:  { type: String },
  status:         { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  responded_at:   { type: Date, default: null },
}, { timestamps: true });


const medicalHistorySchema = new mongoose.Schema({
  user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  condition: { type: String, required: true },
  since:     { type: String, default: '' },
  duration:  { type: String, default: '' },
  severity:  { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
  notes:     { type: String, default: '' },
}, { timestamps: true });

const prescriptionFileSchema = new mongoose.Schema({
  appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  uploaded_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename:       { type: String, required: true },
  mimetype:       { type: String },
  size:           { type: Number },
  data:           { type: Buffer, required: true },
  notes:          { type: String, default: '' },
}, { timestamps: true });

const User             = mongoose.model('User',             userSchema);
const Appointment      = mongoose.model('Appointment',      appointmentSchema);
const Notification     = mongoose.model('Notification',     notificationSchema);
const LinkRequest      = mongoose.model('LinkRequest',      linkRequestSchema);
const MedicalHistory   = mongoose.model('MedicalHistory',   medicalHistorySchema);
const PrescriptionFile = mongoose.model('PrescriptionFile', prescriptionFileSchema);


// ── Static Doctors List ────────────────────────────────────────────────────────
const doctors = [
  { id: '1',  name: 'Dr. Sarah Wilson',      specialization: 'Cardiologist',       experience: 12, language: 'English, Spanish',   rating: 4.9, availability: 'Mon-Fri', fee: 150, hospital: 'Apollo Heart Institute',          photo: 'https://picsum.photos/seed/doc1/200/200',  bio: 'Expert in cardiovascular health with 12+ years of experience.' },
  { id: '2',  name: 'Dr. Arjun Mehta',       specialization: 'Cardiologist',       experience: 16, language: 'English, Hindi',      rating: 4.8, availability: 'Tue-Sat', fee: 180, hospital: 'Fortis Cardiac Centre',           photo: 'https://picsum.photos/seed/doc9/200/200',  bio: 'Specialist in echocardiography and cardiac electrophysiology.' },
  { id: '3',  name: 'Dr. James Chen',        specialization: 'Dermatologist',      experience: 8,  language: 'English, Mandarin',   rating: 4.7, availability: 'Tue-Sat', fee: 120, hospital: 'Skin & Aesthetics Clinic',        photo: 'https://picsum.photos/seed/doc2/200/200',  bio: 'Specializing in medical and cosmetic dermatology.' },
  { id: '4',  name: 'Dr. Priya Nair',        specialization: 'Dermatologist',      experience: 6,  language: 'English, Tamil',      rating: 4.6, availability: 'Mon-Wed', fee: 100, hospital: 'Dermcare Multispeciality',        photo: 'https://picsum.photos/seed/doc10/200/200', bio: 'Focused on pediatric dermatology and eczema treatment.' },
  { id: '5',  name: 'Dr. Elena Rodriguez',   specialization: 'Pediatrician',       experience: 15, language: 'English, Spanish',    rating: 4.8, availability: 'Mon-Thu', fee: 90,  hospital: "Rainbow Children's Hospital",     photo: 'https://picsum.photos/seed/doc3/200/200',  bio: 'Dedicated to providing the best care for children of all ages.' },
  { id: '6',  name: 'Dr. Kavitha Sharma',    specialization: 'Pediatrician',       experience: 10, language: 'English, Hindi',      rating: 4.9, availability: 'Mon-Fri', fee: 85,  hospital: 'Cloudnine Hospital',              photo: 'https://picsum.photos/seed/doc11/200/200', bio: 'Neonatal care specialist with interest in child nutrition.' },
  { id: '7',  name: 'Dr. Michael Brown',     specialization: 'Neurologist',        experience: 10, language: 'English',             rating: 4.6, availability: 'Wed-Sun', fee: 200, hospital: 'NeuroScience Institute',          photo: 'https://picsum.photos/seed/doc4/200/200',  bio: 'Focused on treating complex neurological disorders.' },
  { id: '8',  name: 'Dr. Ananya Krishnan',   specialization: 'Neurologist',        experience: 13, language: 'English, Tamil',      rating: 4.7, availability: 'Mon-Thu', fee: 220, hospital: 'NIMHANS Partner Clinic',          photo: 'https://picsum.photos/seed/doc12/200/200', bio: 'Expert in stroke management and neuro-rehabilitation.' },
  { id: '9',  name: 'Dr. Rahul Verma',       specialization: 'Orthopedic',         experience: 14, language: 'English, Hindi',      rating: 4.8, availability: 'Mon-Fri', fee: 160, hospital: 'Bone & Joint Hospital',           photo: 'https://picsum.photos/seed/doc13/200/200', bio: 'Sports medicine and joint replacement specialist.' },
  { id: '10', name: 'Dr. Linda Martinez',    specialization: 'Orthopedic',         experience: 9,  language: 'English, Spanish',    rating: 4.5, availability: 'Tue-Sat', fee: 140, hospital: 'OrthoPlus Clinic',               photo: 'https://picsum.photos/seed/doc14/200/200', bio: 'Specialist in pediatric orthopedics and spine surgery.' },
  { id: '11', name: 'Dr. Suresh Patel',      specialization: 'Nephrologist',       experience: 18, language: 'English, Gujarati',   rating: 4.9, availability: 'Mon-Fri', fee: 210, hospital: 'Kidney Care Centre',              photo: 'https://picsum.photos/seed/doc15/200/200', bio: 'Pioneer in kidney transplantation with 18 years of experience.' },
  { id: '12', name: 'Dr. Rebecca Lim',       specialization: 'Nephrologist',       experience: 11, language: 'English, Mandarin',   rating: 4.7, availability: 'Wed-Sat', fee: 190, hospital: 'Renal Solutions Hospital',        photo: 'https://picsum.photos/seed/doc16/200/200', bio: 'Specialist in chronic kidney disease management.' },
  { id: '13', name: 'Dr. Deepa Sundaram',    specialization: 'Endocrinologist',    experience: 12, language: 'English, Tamil',      rating: 4.8, availability: 'Tue-Fri', fee: 175, hospital: 'Hormone Health Clinic',           photo: 'https://picsum.photos/seed/doc17/200/200', bio: 'Diabetes and thyroid specialist focused on metabolic disorders.' },
  { id: '14', name: "Dr. Kevin O'Brien",     specialization: 'Endocrinologist',    experience: 7,  language: 'English',             rating: 4.5, availability: 'Mon-Wed', fee: 155, hospital: 'Metabolic Health Institute',     photo: 'https://picsum.photos/seed/doc18/200/200', bio: 'Focused on type 2 diabetes reversal and PCOS management.' },
  { id: '15', name: 'Dr. Meera Iyengar',     specialization: 'Psychiatrist',       experience: 15, language: 'English, Hindi',      rating: 4.9, availability: 'Mon-Sat', fee: 130, hospital: 'Mind Wellness Centre',            photo: 'https://picsum.photos/seed/doc19/200/200', bio: 'Compassionate care for depression, anxiety and PTSD.' },
  { id: '16', name: 'Dr. Thomas Gray',       specialization: 'Psychiatrist',       experience: 20, language: 'English',             rating: 4.8, availability: 'Tue-Fri', fee: 160, hospital: 'Calm Mind Clinic',               photo: 'https://picsum.photos/seed/doc20/200/200', bio: 'Senior psychiatrist specializing in addiction medicine.' },
  { id: '17', name: 'Dr. Anjali Desai',      specialization: 'Ophthalmologist',    experience: 9,  language: 'English, Marathi',    rating: 4.7, availability: 'Mon-Thu', fee: 110, hospital: 'Vision Eye Hospital',             photo: 'https://picsum.photos/seed/doc21/200/200', bio: 'Expert in LASIK surgery and cataract removal.' },
  { id: '18', name: 'Dr. William Park',      specialization: 'Ophthalmologist',    experience: 14, language: 'English, Korean',     rating: 4.8, availability: 'Wed-Sun', fee: 130, hospital: 'ClearVision Medical',             photo: 'https://picsum.photos/seed/doc22/200/200', bio: 'Pioneering retinal specialist.' },
  { id: '19', name: 'Dr. Ravi Shankar',      specialization: 'Pulmonologist',      experience: 11, language: 'English, Telugu',     rating: 4.6, availability: 'Mon-Fri', fee: 145, hospital: 'Breath Easy Clinic',              photo: 'https://picsum.photos/seed/doc23/200/200', bio: 'Specialist in asthma, COPD and sleep apnea.' },
  { id: '20', name: 'Dr. Claire Dubois',     specialization: 'Pulmonologist',      experience: 8,  language: 'English, French',     rating: 4.5, availability: 'Tue-Sat', fee: 135, hospital: 'Lung Health Institute',           photo: 'https://picsum.photos/seed/doc24/200/200', bio: 'Focused on interstitial lung disease.' },
  { id: '21', name: 'Dr. Vikram Nanda',      specialization: 'Gastroenterologist', experience: 13, language: 'English, Hindi',      rating: 4.8, availability: 'Mon-Fri', fee: 170, hospital: 'GI & Liver Centre',               photo: 'https://picsum.photos/seed/doc25/200/200', bio: 'Expert in colonoscopy and inflammatory bowel disease.' },
  { id: '22', name: 'Dr. Sophia Nguyen',     specialization: 'Gastroenterologist', experience: 7,  language: 'English, Vietnamese', rating: 4.6, availability: 'Wed-Sat', fee: 150, hospital: 'Digestive Health Clinic',        photo: 'https://picsum.photos/seed/doc26/200/200', bio: 'Specialist in hepatology and fatty liver disease.' },
  { id: '23', name: 'Dr. Aditya Bose',       specialization: 'Oncologist',         experience: 17, language: 'English, Bengali',    rating: 4.9, availability: 'Mon-Thu', fee: 250, hospital: 'Cancer Care Institute',           photo: 'https://picsum.photos/seed/doc27/200/200', bio: 'Medical oncologist specializing in breast and lung cancers.' },
  { id: '24', name: 'Dr. Hannah Schmidt',    specialization: 'Oncologist',         experience: 12, language: 'English, German',     rating: 4.7, availability: 'Tue-Fri', fee: 230, hospital: 'Hope Oncology Hospital',          photo: 'https://picsum.photos/seed/doc28/200/200', bio: 'Expert in hematological malignancies.' },
  { id: '25', name: 'Dr. Lakshmi Reddy',     specialization: 'Gynecologist',       experience: 16, language: 'English, Telugu',     rating: 4.9, availability: 'Mon-Fri', fee: 140, hospital: "Women's Health Centre",           photo: 'https://picsum.photos/seed/doc29/200/200', bio: 'High-risk pregnancy specialist.' },
  { id: '26', name: 'Dr. Natasha Ivanova',   specialization: 'Gynecologist',       experience: 10, language: 'English, Russian',    rating: 4.7, availability: 'Tue-Sat', fee: 120, hospital: 'Femina Multispeciality',          photo: 'https://picsum.photos/seed/doc30/200/200', bio: 'Focused on fertility treatments and endometriosis.' },
  { id: '27', name: 'Dr. Pramod Kapoor',     specialization: 'ENT Specialist',     experience: 9,  language: 'English, Hindi',      rating: 4.6, availability: 'Mon-Wed', fee: 105, hospital: 'Hearing & Balance Clinic',        photo: 'https://picsum.photos/seed/doc31/200/200', bio: 'Expert in cochlear implants and sinus surgery.' },
  { id: '28', name: 'Dr. Samantha Cole',     specialization: 'ENT Specialist',     experience: 6,  language: 'English',             rating: 4.5, availability: 'Thu-Sun', fee: 95,  hospital: 'ENT & Allergy Associates',        photo: 'https://picsum.photos/seed/doc32/200/200', bio: 'Focused on allergic rhinitis and sleep apnea.' },
  { id: '29', name: 'Dr. Naresh Kumar',      specialization: 'Urologist',          experience: 14, language: 'English, Kannada',    rating: 4.7, availability: 'Mon-Fri', fee: 165, hospital: 'Urology & Kidney Hospital',       photo: 'https://picsum.photos/seed/doc33/200/200', bio: 'Robotic urologic surgeon.' },
  { id: '30', name: 'Dr. Carlos Fernandez',  specialization: 'Urologist',          experience: 11, language: 'English, Spanish',    rating: 4.6, availability: 'Tue-Sat', fee: 155, hospital: "Men's Health & Urology",          photo: 'https://picsum.photos/seed/doc34/200/200', bio: 'Expert in laparoscopic kidney surgery.' },
  { id: '31', name: 'Dr. Sunita Chopra',     specialization: 'Rheumatologist',     experience: 13, language: 'English, Punjabi',    rating: 4.8, availability: 'Mon-Thu', fee: 180, hospital: 'Arthritis & Rheumatology Clinic',  photo: 'https://picsum.photos/seed/doc35/200/200', bio: 'Specialist in rheumatoid arthritis and lupus.' },
  { id: '32', name: 'Dr. Amit Shah',         specialization: 'General Physician',  experience: 7,  language: 'English, Gujarati',   rating: 4.5, availability: 'Mon-Sat', fee: 70,  hospital: 'City Medical Centre',             photo: 'https://picsum.photos/seed/doc36/200/200', bio: 'General practitioner with expertise in primary care.' },
  { id: '33', name: 'Dr. Grace Okonkwo',     specialization: 'General Physician',  experience: 5,  language: 'English, Igbo',       rating: 4.4, availability: 'Tue-Sun', fee: 65,  hospital: 'Community Health Centre',         photo: 'https://picsum.photos/seed/doc37/200/200', bio: 'Focused on preventive care and lifestyle medicine.' },
];



// ── Helper: safe user object (strips password, normalises id/name) ─────────────
const safeUser = (u) => ({
  id:             u._id.toString(),
  name:           u.username,
  username:       u.username,
  email:          u.email,
  phone:          u.phone,
  role:           u.role,
  guardian_id:    u.guardian_id ? u.guardian_id.toString() : null,
  // doctor fields
  specialization: u.specialization || null,
  hospital:       u.hospital       || null,
  experience:     u.experience     || 0,
  fee:            u.fee            || 0,
  rating:         u.rating         || 0,
  availability:   u.availability   || 'Mon-Fri',
  bio:            u.bio            || '',
});

// ── Connect to MongoDB Atlas, then start Express ───────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MC] ✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[MC] ❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  const app = express();

const allowedOrigins = [
  "https://medi-connect-neon-nine.vercel.app",
  "https://feel-races-judicial-the.trycloudflare.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));
  app.use(express.json());

  app.get("/health", (req, res) => {
  res.send("OK");
});

  // ── Ensure uploads directory exists ──────────────────────────────────────────
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

  // ── Consultation Routes ───────────────────────────────────────────────────────
  app.use('/api/consultation', consultationRoutes);
  app.use('/api/prescriptions', prescriptionScanRoute);

  // ── Auth Middleware ──────────────────────────────────────────────────────────
  const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);
      req.user = decoded;
      next();
    });
  };

  // ── Debug ────────────────────────────────────────────────────────────────────
  app.get('/api/debug/users', async (req, res) => {
    const users = await User.find({}, '-password');
    res.setHeader('Content-Type', 'text/plain');
    res.send(
      `Total users: ${users.length}\n\n` +
      users.map((u, i) =>
        `[${i+1}] ${u.email} | role: ${u.role} | guardian_id: ${u.guardian_id || 'none'}`
      ).join('\n')
    );
  });



  // ── Register ─────────────────────────────────────────────────────────────────
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password, phone, role, guardian_email, patient_email } = req.body;

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username:username,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone:    phone || null,
        role:     role  || 'patient',
        guardian_id: null,
        // save doctor fields if registering as doctor
        specialization: role === 'doctor' ? (req.body.specialization || null) : null,
        hospital:       role === 'doctor' ? (req.body.hospital       || null) : null,
        experience:     role === 'doctor' ? (Number(req.body.experience) || 0) : 0,
        fee:            role === 'doctor' ? (Number(req.body.fee)        || 0) : 0,
      });

      // Patient links guardian directly at signup (patient-initiated = no approval needed)
      if (role === 'patient' && guardian_email) {
        const guardian = await User.findOne({ email: guardian_email.toLowerCase(), role: 'guardian' });
        if (guardian) {
          newUser.guardian_id = guardian._id;
          await Notification.create({
            user_id: guardian._id,
            title:   'New Patient Linked',
            message: `${username} has registered and linked you as their guardian.`,
            type:    'link_accepted',
          });
        }
      }

      await newUser.save();

      // Guardian sends link REQUEST at signup — patient must accept
      if (role === 'guardian' && patient_email) {
        const patient = await User.findOne({ email: patient_email.toLowerCase(), role: 'patient' });
        if (patient) {
          const linkReq = await LinkRequest.create({
            guardian_id:    newUser._id,
            guardian_name:  newUser.username,
            guardian_email: newUser.email,
            patient_id:     patient._id,
            patient_email:  patient.email,
            status:         'pending',
          });
          await Notification.create({
            user_id:    patient._id,
            title:      'Guardian Link Request',
            message:    `${username} (${newUser.email}) has registered as your guardian and wants to manage your health records. Accept or reject in Settings → Linked Accounts.`,
            type:       'link_request',
            request_id: linkReq._id,
          });
        }
      }

      console.log(`[MC] Registered: ${email} (${role})`);
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('[MC] Register error:', err);
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  });

  // ── Login ────────────────────────────────────────────────────────────────────
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({ token, user: safeUser(user) });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  });

  // ── Doctors ────────────────────────────────────────────────────────────────────
  app.get('/api/doctors', auth, async (req, res) => {
    try {
      const { specialization } = req.query;

      // Fetch ALL real registered doctors from DB (no specialization filter at DB level)
      const realDoctors = await User.find({ role: 'doctor' }, '-password');

      let realList = realDoctors.map(d => ({
        id:             d._id.toString(),
        name:           d.username,
        specialization: d.specialization || 'General Physician',
        hospital:       d.hospital       || 'Private Practice',
        experience:     d.experience     || 0,
        fee:            d.fee            || 0,
        rating:         d.rating         || 0,
        availability:   d.availability   || 'Mon-Fri',
        bio:            d.bio            || '',
        photo:          d.avatar         || null,
        language:       'English',
        isReal:         true,
      }));

      // Apply specialization filter on real doctors
      if (specialization && specialization !== 'All') {
        realList = realList.filter(d => d.specialization === specialization);
      }

      // Dummy fallback list
      let dummyList = specialization && specialization !== 'All'
        ? doctors.filter(d => d.specialization === specialization)
        : doctors;

      // Always show real doctors first, then dummies
      const combined = [...realList, ...dummyList];

      res.json(combined);
    } catch (err) {
      console.error('[MC] Doctors fetch error:', err.message);
      res.json(doctors); // fallback to static list on error
    }
  });

  app.get('/api/doctors/:id', auth, async (req, res) => {
    // First check real doctors in DB (MongoDB ObjectId format)
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        const dbDoctor = await User.findOne({ _id: req.params.id, role: 'doctor' }, '-password');
        if (dbDoctor) {
          return res.json({
            success: true,
            doctor: {
              id:             dbDoctor._id.toString(),
              name:           dbDoctor.username,
              specialization: dbDoctor.specialization || 'General Physician',
              hospital:       dbDoctor.hospital       || 'Private Practice',
              experience:     dbDoctor.experience     || 0,
              fee:            dbDoctor.fee             || 0,
              rating:         dbDoctor.rating          || 0,
              availability:   dbDoctor.availability    || 'Mon-Fri',
              bio:            dbDoctor.bio             || '',
              photo:          dbDoctor.avatar          || null,
              language:       'English',
              isReal:         true,
            },
          });
        }
      } catch (_) {}
    }
    // Fall back to static list
    const doctor = doctors.find(d => d.id === req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ success: true, doctor });
  });

  // ── Appointments ──────────────────────────────────────────────────────────────
  app.get('/api/appointments', auth, async (req, res) => {
    try {
      let query = {};
      if (req.user.role === 'doctor') {
        query = { doctor_id: req.user.id };
      } else if (req.user.role === 'guardian') {
        const deps = await User.find({ guardian_id: req.user.id }, '_id');
        query = { user_id: { $in: deps.map(d => d._id) } };
      } else {
        query = { user_id: req.user.id };
      }

      const appointments = await Appointment.find(query).sort({ createdAt: -1 });

      const enriched = await Promise.all(appointments.map(async (a) => {
        // Look up in static list first, then DB
        let doc = doctors.find(d => d.id === a.doctor_id);
        if (!doc && mongoose.Types.ObjectId.isValid(a.doctor_id)) {
          const dbDoc = await User.findOne({ _id: a.doctor_id, role: 'doctor' }, 'username specialization hospital experience fee avatar');
          if (dbDoc) {
            doc = {
              id:             dbDoc._id.toString(),
              name:           dbDoc.username,
              specialization: dbDoc.specialization || 'General Physician',
              hospital:       dbDoc.hospital       || 'Private Practice',
              experience:     dbDoc.experience     || 0,
              fee:            dbDoc.fee            || 0,
              photo:          dbDoc.avatar         || null,
            };
          }
        }
        const patient = await User.findById(a.user_id, 'username email');
        const isGuardianBooked = a.booked_by.toString() !== a.user_id.toString();
        const booker  = isGuardianBooked ? await User.findById(a.booked_by, 'username') : null;
        return {
          id:                 a._id.toString(),
          _id:                a._id.toString(),
          user_id:            a.user_id.toString(),
          booked_by:          a.booked_by.toString(),
          date:               a.date,
          time:               a.time,
          status:             a.status,
          meeting_link:       a.meeting_link,
          doctor:             doc || null,
          patient:            patient ? { id: patient._id.toString(), name: patient.username, email: patient.email } : null,
          booked_by_guardian: isGuardianBooked,
          booked_by_name:     booker?.username || null,
        };
      }));

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch appointments', error: err.message });
    }
  });

  const bookHandler = async (req, res) => {
    try {
      const { doctor_id, date, time, patient_id } = req.body;

      // Check static dummy list first, then real DB doctors
      let doc = doctors.find(d => d.id === doctor_id);
      if (!doc && mongoose.Types.ObjectId.isValid(doctor_id)) {
        const dbDoc = await User.findOne({ _id: doctor_id, role: 'doctor' }, '-password');
        if (dbDoc) {
          doc = {
            id:             dbDoc._id.toString(),
            name:           dbDoc.username,
            specialization: dbDoc.specialization || 'General Physician',
            hospital:       dbDoc.hospital       || 'Private Practice',
            experience:     dbDoc.experience     || 0,
            fee:            dbDoc.fee            || 0,
          };
        }
      }
      if (!doc) return res.status(404).json({ message: 'Doctor not found' });

      let targetUserId = req.user.id;
      if (req.user.role === 'guardian' && patient_id) {
        const patient = await User.findOne({ _id: patient_id, guardian_id: req.user.id });
        if (!patient) return res.status(403).json({ message: 'This patient is not linked to your account.' });
        targetUserId = patient_id;
      }

      const appt = await Appointment.create({
        user_id:      targetUserId,
        booked_by:    req.user.id,
        doctor_id,
        date,
        time,
        status:       'upcoming',
        meeting_link: `https://meet.jit.si/MediConnect-${Math.random().toString(36).substr(2, 5)}`,
      });

      const bookerUser  = await User.findById(req.user.id, 'username');
      const patientUser = await User.findById(targetUserId, 'username guardian_id');
      const isGuardianBooking = req.user.role === 'guardian';

      // Notify patient
      await Notification.create({
        user_id: targetUserId,
        title:   'Appointment Confirmed',
        message: isGuardianBooking
          ? `Your guardian ${bookerUser?.username} booked an appointment with ${doc.name} for you on ${date} at ${time}.`
          : `Your appointment with ${doc.name} on ${date} at ${time} is confirmed.`,
        type: 'appointment',
      });

      // Notify guardian if patient self-booked and has a guardian
      if (!isGuardianBooking && patientUser?.guardian_id) {
        await Notification.create({
          user_id: patientUser.guardian_id,
          title:   'Patient Booked Appointment',
          message: `${patientUser.username} booked an appointment with ${doc.name} on ${date} at ${time}.`,
          type:    'appointment',
        });
      }

      res.status(201).json({
        id:                 appt._id.toString(),
        _id:                appt._id.toString(),
        user_id:            appt.user_id.toString(),
        booked_by:          appt.booked_by.toString(),
        date:               appt.date,
        time:               appt.time,
        status:             appt.status,
        meeting_link:       appt.meeting_link,
        doctor:             doc,
        patient:            patientUser ? { id: patientUser._id.toString(), name: patientUser.username } : null,
        booked_by_guardian: isGuardianBooking,
        booked_by_name:     isGuardianBooking ? bookerUser?.username : null,
      });
    } catch (err) {
      res.status(500).json({ message: 'Booking failed', error: err.message });
    }
  };
  app.post('/api/appointment',  auth, bookHandler);
  app.post('/api/appointments', auth, bookHandler);

  app.patch('/api/appointments/:id', auth, async (req, res) => {
    try {
      const { date, time, status } = req.body;
      const update = {};
      if (date)   update.date   = date;
      if (time)   update.time   = time;
      if (status) update.status = status;

      const oldAppt = await Appointment.findById(req.params.id);
      if (!oldAppt) return res.status(404).json({ message: 'Appointment not found' });

      const appt = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true });

      // ── Send reschedule notifications ──────────────────────────────────────
      const isReschedule = (date || time) && !status;
      if (isReschedule) {
        let docName = 'your doctor';
        const staticDoc = doctors.find(d => d.id === appt.doctor_id);
        if (staticDoc) {
          docName = staticDoc.name;
        } else if (mongoose.Types.ObjectId.isValid(appt.doctor_id)) {
          const dbDoc = await User.findById(appt.doctor_id, 'username');
          if (dbDoc) docName = dbDoc.username;
        }

        const patient      = await User.findById(appt.user_id, 'username guardian_id');
        const rescheduler  = await User.findById(req.user.id, 'username role');
        const newDate      = date || oldAppt.date;
        const newTime      = time || oldAppt.time;
        const byLabel      = rescheduler?.role === 'guardian'
          ? `Guardian ${rescheduler.username}`
          : rescheduler?.role === 'doctor'
          ? `Dr. ${rescheduler.username}`
          : rescheduler?.username || 'Someone';

        // Notify patient (if they didn't reschedule themselves)
        if (appt.user_id.toString() !== req.user.id) {
          await Notification.create({
            user_id: appt.user_id,
            title:   'Appointment Rescheduled',
            message: `${byLabel} rescheduled your appointment with ${docName} to ${newDate} at ${newTime}.`,
            type:    'appointment',
          });
        }

        // Notify real registered doctor
        if (mongoose.Types.ObjectId.isValid(appt.doctor_id) &&
            appt.doctor_id.toString() !== req.user.id) {
          await Notification.create({
            user_id: appt.doctor_id,
            title:   'Appointment Rescheduled',
            message: `${byLabel} rescheduled an appointment with ${patient?.username || 'a patient'} to ${newDate} at ${newTime}.`,
            type:    'appointment',
          });
        }

        // Notify guardian if patient has one and guardian didn't reschedule
        if (patient?.guardian_id &&
            patient.guardian_id.toString() !== req.user.id) {
          await Notification.create({
            user_id: patient.guardian_id,
            title:   'Appointment Rescheduled',
            message: `${byLabel} rescheduled ${patient.username}'s appointment with ${docName} to ${newDate} at ${newTime}.`,
            type:    'appointment',
          });
        }
      }

      res.json({ ...appt.toObject(), id: appt._id.toString() });
    } catch (err) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  });

  // ── Dependents ────────────────────────────────────────────────────────────────
  const dependentsHandler = async (req, res) => {
    try {
      if (req.user.role !== 'guardian') return res.sendStatus(403);
      const deps = await User.find({ guardian_id: req.user.id }, '-password');
      res.json(deps.map(safeUser));
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch dependents', error: err.message });
    }
  };
  app.get('/api/guardian/dependents', auth, dependentsHandler);
  app.get('/api/users/dependents',    auth, dependentsHandler);

  // ── Profile ───────────────────────────────────────────────────────────────────
  app.get('/api/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id, '-password');
      if (!user) return res.sendStatus(404);
      res.json(safeUser(user));
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
    }
  });

  const updateProfileHandler = async (req, res) => {
    try {
      const { name, username, phone, specialization, hospital, experience, fee } = req.body;
      const update = {};
      if (name || username)  update.username = name || username;
      if (phone)             update.phone    = phone;
      // doctor-specific
      if (specialization !== undefined) update.specialization = specialization;
      if (hospital       !== undefined) update.hospital       = hospital;
      if (experience     !== undefined) update.experience     = Number(experience) || 0;
      if (fee            !== undefined) update.fee            = Number(fee)        || 0;
      const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, select: '-password' });
      if (!user) return res.sendStatus(404);
      res.json({ user: safeUser(user) });
    } catch (err) {
      res.status(500).json({ message: 'Profile update failed', error: err.message });
    }
  };
  app.put('/api/users/profile', auth, updateProfileHandler);
  app.put('/api/profile',       auth, updateProfileHandler);

  // ── Link Status ───────────────────────────────────────────────────────────────
  app.get('/api/link/status', auth, async (req, res) => {
    try {
      const me = await User.findById(req.user.id);
      if (!me) return res.sendStatus(404);

      if (me.role === 'patient') {
        if (me.guardian_id) {
          let guardian = null;
          // Try ObjectId lookup first
          try {
            guardian = await User.findById(me.guardian_id, '-password');
          } catch (_) {}
          // If not found, try string match on _id
          if (!guardian) {
            const allGuardians = await User.find({ role: 'guardian' }, '-password');
            guardian = allGuardians.find(g =>
              g._id.toString() === me.guardian_id.toString()
            ) || null;
          }
          if (guardian) return res.json({ guardian: safeUser(guardian) });
        }
        return res.json({ guardian: null });
      }

      if (me.role === 'guardian') {
        // Find patients whose guardian_id matches this guardian's _id (any format)
        const myIdStr = me._id.toString();
        const allPatients = await User.find({ role: 'patient' }, '-password');
        const dependents = allPatients.filter(p =>
          p.guardian_id && p.guardian_id.toString() === myIdStr
        );
        return res.json({ dependents: dependents.map(safeUser) });
      }

      res.json({});
    } catch (err) {
      console.error('[MC] link/status error:', err.message);
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ── Link Requests ─────────────────────────────────────────────────────────────
  app.get('/api/link/requests', auth, async (req, res) => {
    try {
      let requests = [];
      if (req.user.role === 'patient')
        requests = await LinkRequest.find({ patient_id: req.user.id, status: 'pending' });
      else if (req.user.role === 'guardian')
        requests = await LinkRequest.find({ guardian_id: req.user.id });
      res.json(requests.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // Guardian sends link request (from Settings or /api/link/patient)
  const sendLinkRequestHandler = async (req, res) => {
    try {
      if (req.user.role !== 'guardian')
        return res.status(403).json({ message: 'Only guardians can send link requests.' });
      const { patient_email } = req.body;
      if (!patient_email) return res.status(400).json({ message: 'Patient email is required.' });

      const patient = await User.findOne({ email: patient_email.toLowerCase(), role: 'patient' });
      if (!patient) return res.status(404).json({ message: `No patient account found with email "${patient_email}".` });
      if (patient.guardian_id?.toString() === req.user.id)
        return res.status(400).json({ message: 'This patient is already linked to your account.' });

      const existing = await LinkRequest.findOne({ guardian_id: req.user.id, patient_id: patient._id, status: 'pending' });
      if (existing) return res.status(400).json({ message: 'A link request is already pending for this patient.' });

      const guardian = await User.findById(req.user.id);
      const linkReq  = await LinkRequest.create({
        guardian_id:    req.user.id,
        guardian_name:  guardian.username,
        guardian_email: guardian.email,
        patient_id:     patient._id,
        patient_email:  patient.email,
        status:         'pending',
      });

      await Notification.create({
        user_id:    patient._id,
        title:      'Guardian Link Request',
        message:    `${guardian.username} (${guardian.email}) wants to be your guardian. Accept or reject in Settings → Linked Accounts.`,
        type:       'link_request',
        request_id: linkReq._id,
      });

      res.json({ message: `Link request sent to ${patient_email}. Waiting for patient to accept.` });
    } catch (err) {
      res.status(500).json({ message: 'Failed to send link request', error: err.message });
    }
  };
  app.post('/api/link/request', auth, sendLinkRequestHandler);
  app.post('/api/link/patient', auth, sendLinkRequestHandler);

  // Patient responds to link request
  app.post('/api/link/respond', auth, async (req, res) => {
    try {
      if (req.user.role !== 'patient')
        return res.status(403).json({ message: 'Only patients can respond to link requests.' });
      const { request_id, action } = req.body;
      if (!request_id || !['accept', 'reject'].includes(action))
        return res.status(400).json({ message: 'request_id and action (accept/reject) are required.' });

      const linkReq = await LinkRequest.findOne({ _id: request_id, patient_id: req.user.id });
      if (!linkReq) return res.status(404).json({ message: 'Link request not found.' });

      linkReq.status       = action === 'accept' ? 'accepted' : 'rejected';
      linkReq.responded_at = new Date();
      await linkReq.save();

      const patient = await User.findById(req.user.id, 'username');

      if (action === 'accept') {
        await User.findByIdAndUpdate(req.user.id, { guardian_id: linkReq.guardian_id });
        await Notification.create({
          user_id: linkReq.guardian_id,
          title:   'Link Request Accepted',
          message: `${patient.username} has accepted your guardian request. You can now view their health records.`,
          type:    'link_accepted',
        });
        await Notification.findOneAndUpdate({ request_id: linkReq._id }, { resolved: true });
        return res.json({ message: 'Guardian link accepted.' });
      } else {
        await Notification.create({
          user_id: linkReq.guardian_id,
          title:   'Link Request Rejected',
          message: `${patient.username} has declined your guardian request.`,
          type:    'link_rejected',
        });
        return res.json({ message: 'Guardian link request rejected.' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Failed to respond', error: err.message });
    }
  });

  // Patient directly links guardian (patient-initiated, no approval needed)
  app.post('/api/link/guardian', auth, async (req, res) => {
    try {
      if (req.user.role !== 'patient')
        return res.status(403).json({ message: 'Only patients can link a guardian.' });
      const { guardian_email } = req.body;
      if (!guardian_email) return res.status(400).json({ message: 'Guardian email is required.' });

      const guardian = await User.findOne({ email: guardian_email.toLowerCase(), role: 'guardian' });
      if (!guardian) return res.status(404).json({ message: `No guardian found with email "${guardian_email}".` });

      const patient = await User.findByIdAndUpdate(req.user.id, { guardian_id: guardian._id }, { new: true });
      await Notification.create({
        user_id: guardian._id,
        title:   'New Patient Linked',
        message: `${patient.username} has linked you as their guardian.`,
        type:    'link_accepted',
      });
      res.json({ message: 'Guardian linked successfully!', guardian: safeUser(guardian) });
    } catch (err) {
      res.status(500).json({ message: 'Failed to link guardian', error: err.message });
    }
  });

  // Patient unlinks guardian
  app.delete('/api/link/guardian', auth, async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.user.id, { guardian_id: null });
      res.json({ message: 'Guardian unlinked.' });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // Guardian removes a patient
  app.delete('/api/link/patient/:id', auth, async (req, res) => {
    try {
      const patient = await User.findOne({ _id: req.params.id, guardian_id: req.user.id });
      if (!patient) return res.status(404).json({ message: 'Patient not linked to you.' });
      await User.findByIdAndUpdate(req.params.id, { guardian_id: null });
      res.json({ message: 'Patient removed.' });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ── Notifications ─────────────────────────────────────────────────────────────
  app.get('/api/notifications', auth, async (req, res) => {
    try {
      let query = {};
      if (req.user.role === 'guardian') {
        const deps = await User.find({ guardian_id: req.user.id }, '_id');
        query = { user_id: { $in: [req.user.id, ...deps.map(d => d._id)] } };
      } else {
        query = { user_id: req.user.id };
      }
      const notifs = await Notification.find(query).sort({ createdAt: -1 });
      res.json(notifs.map(n => ({
        id:         n._id.toString(),
        user_id:    n.user_id.toString(),
        title:      n.title,
        message:    n.message,
        type:       n.type,
        request_id: n.request_id ? n.request_id.toString() : null,
        read:       n.read,
        resolved:   n.resolved,
        date:       n.createdAt,
      })));
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
    }
  });

  app.patch('/api/notifications/read-all', auth, async (req, res) => {
    try {
      await Notification.updateMany({ user_id: req.user.id }, { read: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  app.patch('/api/notifications/:id/read', auth, async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ── Reminders ─────────────────────────────────────────────────────────────────
  // ── Reminders ──────────────────────────────────────────────
app.get('/api/reminders', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reminders = await Reminder.find({
      userId: req.user.id,
      isActive: true,
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    const enriched = reminders.map(r => ({
      ...r.toObject(),
      todayStatus: r.times.map(t => {
        const log = (r.takenLog || []).find(l => l.date === today && l.time === t);
        return { time: t, taken: log ? log.taken : false };
      })
    }));

    res.json({ success: true, reminders: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

app.post('/api/reminders/self-add', auth, async (req, res) => {
  try {
    const { medicineName, dosage, frequency, duration, instructions } = req.body;
    const times = frequency.split(',').map(t => t.trim().toLowerCase());
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(duration));
    const reminder = await Reminder.create({
      userId: req.user.id, medicineName, dosage, times,
      endDate, instructions: instructions || '', isActive: true,
    });
    res.status(201).json({ success: true, reminder });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

app.post('/api/reminders/mark-taken', auth, async (req, res) => {
  try {
    const { reminderId, time } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const reminder = await Reminder.findOne({ _id: reminderId, userId: req.user.id });
    if (!reminder) return res.status(404).json({ message: 'Not found' });
    const idx = reminder.takenLog.findIndex(l => l.date === today && l.time === time);
    if (idx >= 0) reminder.takenLog[idx].taken = true;
    else reminder.takenLog.push({ date: today, time, taken: true });
    await reminder.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

app.delete('/api/reminders/:id', auth, async (req, res) => {
  try {
    await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

  // ── Prescriptions ─────────────────────────────────────────────────────────────
  app.get('/api/prescriptions', auth, async (req, res) => {
    try {
      const prescriptions = await Prescription.find({ user_id: req.user.id }).sort({ createdAt: -1 });
      res.json(prescriptions.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ⚠️ THIS MUST STAY AFTER /files and /download routes — moved to bottom
  // ── Medical History ───────────────────────────────────────────────────────────
  app.get('/api/medical-history', auth, async (req, res) => {
    try {
      // Patient: own history. Doctor/Guardian: can read a specific patient's history via query param
      const targetId = req.query.patient_id || req.user.id;
      // Guardian can only read their own dependents
      if (req.query.patient_id && req.user.role === 'guardian') {
        const dep = await User.findOne({ _id: req.query.patient_id, guardian_id: req.user.id });
        if (!dep) return res.status(403).json({ message: 'Access denied.' });
      }
      const history = await MedicalHistory.find({ user_id: targetId }).sort({ createdAt: -1 });
      res.json(history.map(h => ({ ...h.toObject(), id: h._id.toString() })));
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  app.post('/api/medical-history', auth, async (req, res) => {
    try {
      if (req.user.role !== 'patient') return res.status(403).json({ message: 'Only patients can add medical history.' });
      const { condition, since, duration, severity, notes } = req.body;
      if (!condition?.trim()) return res.status(400).json({ message: 'Condition is required.' });
      const entry = await MedicalHistory.create({
        user_id: req.user.id, condition, since, duration, severity, notes,
      });
      res.status(201).json({ ...entry.toObject(), id: entry._id.toString() });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  app.delete('/api/medical-history/:id', auth, async (req, res) => {
    try {
      await MedicalHistory.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
      res.json({ message: 'Entry deleted.' });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ── Prescription File Delete (doctor only) ────────────────────────────────────
  app.delete('/api/prescriptions/files/:id', auth, async (req, res) => {
    try {
      if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can delete prescriptions.' });
      const file = await PrescriptionFile.findOne({ _id: req.params.id, uploaded_by: req.user.id });
      if (!file) return res.status(404).json({ message: 'Prescription not found or not yours.' });
      await PrescriptionFile.findByIdAndDelete(req.params.id);
      res.json({ message: 'Prescription deleted.' });
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ── Appointment 30-min Reminder checker (called on cron or on page load) ──────
  // Returns upcoming appointments within the next 30 minutes for the current user
  app.get('/api/appointments/reminders', auth, async (req, res) => {
    try {
      const now     = new Date();
      const in30    = new Date(now.getTime() + 31 * 60 * 1000);
      const todayStr = now.toISOString().split('T')[0];

      let query = { status: 'upcoming', date: todayStr };
      if (req.user.role === 'doctor') {
        query.doctor_id = req.user.id;
      } else if (req.user.role === 'guardian') {
        const deps = await User.find({ guardian_id: req.user.id }, '_id');
        query.user_id = { $in: deps.map(d => d._id) };
      } else {
        query.user_id = req.user.id;
      }

      const appts = await Appointment.find(query);

      // Filter: appointment time is within next 30 minutes
      const upcoming = appts.filter(a => {
        try {
          const [timePart, meridiem] = a.time.split(' ');
          let [hours, minutes] = timePart.split(':').map(Number);
          if (meridiem === 'PM' && hours !== 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          const apptTime = new Date(now);
          apptTime.setHours(hours, minutes, 0, 0);
          return apptTime >= now && apptTime <= in30;
        } catch { return false; }
      });

      const enriched = await Promise.all(upcoming.map(async a => {
        let doc = doctors.find(d => d.id === a.doctor_id);
        if (!doc && mongoose.Types.ObjectId.isValid(a.doctor_id)) {
          const dbDoc = await User.findById(a.doctor_id, 'username specialization');
          if (dbDoc) doc = { name: dbDoc.username, specialization: dbDoc.specialization };
        }
        const patient = await User.findById(a.user_id, 'username');
        return {
          id:           a._id.toString(),
          date:         a.date,
          time:         a.time,
          meeting_link: a.meeting_link,
          doctor:       doc,
          patient:      patient ? { name: patient.username } : null,
        };
      }));

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  // ── Prescription files — fix visibility for patient AND guardian ───────────────

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
    },
  });

  // Doctor uploads a prescription file
  app.post('/api/prescriptions/upload', auth, upload.single('prescription'), async (req, res) => {
    try {
      if (req.user.role !== 'doctor')
        return res.status(403).json({ message: 'Only doctors can upload prescriptions.' });
      if (!req.file)
        return res.status(400).json({ message: 'No file uploaded.' });

      const { appointment_id, patient_email, notes } = req.body;

      // Resolve which patient this prescription is for
      let patientId = null;

      if (appointment_id) {
        // Linked to a specific appointment
        const appt = await Appointment.findById(appointment_id);
        if (!appt) return res.status(404).json({ message: 'Appointment not found.' });
        patientId = appt.user_id;
      } else if (patient_email) {
        // Doctor provided patient email directly (no appointment needed)
        const patient = await User.findOne({ email: patient_email.toLowerCase(), role: 'patient' });
        if (!patient)
          return res.status(404).json({ message: `No patient found with email "${patient_email}".` });
        patientId = patient._id;
      } else {
        return res.status(400).json({ message: 'Provide either appointment_id or patient_email.' });
      }

      const prescFile = await PrescriptionFile.create({
        appointment_id: appointment_id || null,
        uploaded_by:    req.user.id,
        patient_id:     patientId,
        filename:       req.file.originalname,
        mimetype:       req.file.mimetype,
        size:           req.file.size,
        data:           req.file.buffer,
        notes:          notes || '',
      });

      // Notify patient
      await Notification.create({
        user_id: patientId,
        title:   'Prescription Available',
        message: 'Your doctor has uploaded a prescription. View and download it from your Prescriptions page.',
        type:    'reminder',
      });

      res.status(201).json({
        id:         prescFile._id.toString(),
        _id:        prescFile._id.toString(),
        filename:   prescFile.filename,
        mimetype:   prescFile.mimetype,
        size:       prescFile.size,
        notes:      prescFile.notes,
        uploadedAt: prescFile.createdAt,
      });
    } catch (err) {
      if (err.message?.includes('Only PDF'))
        return res.status(400).json({ message: err.message });
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ message: 'File size must be under 5MB.' });
      res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  });

  // Get uploaded files for a specific appointment
  app.get('/api/prescriptions/files/:appointmentId', auth, async (req, res) => {
    try {
      const files = await PrescriptionFile.find(
        { appointment_id: req.params.appointmentId },
        '-data'
      ).sort({ createdAt: -1 });
      res.json(files.map(f => ({
        id:         f._id.toString(),
        _id:        f._id.toString(),
        filename:   f.filename,
        mimetype:   f.mimetype,
        size:       f.size,
        notes:      f.notes,
        uploadedAt: f.createdAt,
      })));
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch files', error: err.message });
    }
  });

  // Get all uploaded prescription files for the logged-in patient
  app.get('/api/prescriptions/files', auth, async (req, res) => {
  try {
    let files = [];

    if (req.user.role === 'doctor') {
      files = await PrescriptionFile.find(
        { uploaded_by: req.user.id },
        '-data'
      ).sort({ createdAt: -1 });

    } else if (req.user.role === 'guardian') {
      const myIdStr = req.user.id.toString();
      const allPatients = await User.find({ role: 'patient' }, '_id guardian_id');
      const depIds = allPatients
        .filter(p => p.guardian_id && p.guardian_id.toString() === myIdStr)
        .map(p => p._id);
      if (depIds.length === 0) return res.json([]);
      files = await PrescriptionFile.find(
        { patient_id: { $in: depIds } },
        '-data'
      ).sort({ createdAt: -1 });

    } else {
      // patient — string-safe match, no ObjectId cast
      const myIdStr = req.user.id.toString();
      const allFiles = await PrescriptionFile.find({}, '-data').sort({ createdAt: -1 });
      files = allFiles.filter(f => f.patient_id && f.patient_id.toString() === myIdStr);
    }

    const enriched = await Promise.all(files.map(async f => {
      let patientName = null;
      if (req.user.role === 'doctor' || req.user.role === 'guardian') {
        const pat = await User.findById(f.patient_id, 'username');
        patientName = pat?.username || null;
      }
      return {
        id:          f._id.toString(),
        _id:         f._id.toString(),
        filename:    f.filename,
        mimetype:    f.mimetype,
        size:        f.size,
        notes:       f.notes,
        uploadedAt:  f.createdAt,
        patientName,
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('[MC] prescriptions/files error:', err.message);
    res.status(500).json({ message: 'Failed to fetch files', error: err.message });
  }
});

  // Download / view a single prescription file
  app.get('/api/prescriptions/download/:id', auth, async (req, res) => {
    try {
      const file = await PrescriptionFile.findById(req.params.id);
      if (!file) return res.status(404).json({ message: 'File not found.' });

      const myIdStr = req.user.id.toString();
      const isPatient = file.patient_id?.toString() === myIdStr;
      const isUploader = file.uploaded_by?.toString() === myIdStr;

      // Guardian: check if patient belongs to them
      let isGuardian = false;
      if (req.user.role === 'guardian') {
        const patient = await User.findById(file.patient_id, 'guardian_id');
        isGuardian = patient?.guardian_id?.toString() === myIdStr;
      }

      if (!isPatient && !isUploader && !isGuardian)
        return res.status(403).json({ message: 'Access denied.' });

      res.set('Content-Type', file.mimetype);
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);
      res.send(file.data);
    } catch (err) {
      res.status(500).json({ message: 'Download failed', error: err.message });
    }
  });
  // ── This is LAST so it doesn't swallow /files and /download ──────────────────
  app.get('/api/prescriptions/:appointmentId', auth, async (req, res) => {
    try {
      const prescriptions = await Prescription.find({ appointment_id: req.params.appointmentId });
      res.json(prescriptions.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } catch (err) {
      res.status(500).json({ message: 'Failed', error: err.message });
    }
  });

  const server = createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MC] 🚀 Server running on http://localhost:${PORT}`);
  });

  // ── WebRTC Signaling via Socket.IO ─────────────────────────────────────────
  const io = new SocketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const rooms = {}; // roomId -> [{ socketId, userName }]

  io.on('connection', (socket) => {
    console.log('[WS] connected:', socket.id);

    // ── Chat events ──────────────────────────────────────────────────────────
   socket.on('join-chat', ({ room, userName }) => {
  socket.join(room);
  console.log(`${userName} joined chat ${room}`);
});

socket.on('send-chat', ({ room, msg }) => {
  console.log('Chat message received:', msg);

  // 🔥 BROADCAST TO EVERYONE IN ROOM
  io.to(room).emit('chat-message', msg);
});

    // ── WebRTC events ─────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomId, userName }) => {
      socket.join(roomId);
      if (!rooms[roomId]) rooms[roomId] = [];
      rooms[roomId].push({ socketId: socket.id, userName });

      // Tell this user about everyone already in the room
      const others = rooms[roomId].filter(p => p.socketId !== socket.id);
      socket.emit('room-users', others);

      // Tell everyone else a new user joined
      socket.to(roomId).emit('user-joined', { socketId: socket.id, userName });

      console.log(`[WS] ${userName} joined room ${roomId}, total: ${rooms[roomId].length}`);
    });

    socket.on('offer', ({ to, offer }) => {
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('leave-room', ({ roomId }) => {
      handleLeave(socket, roomId);
    });

    socket.on('disconnect', () => {
      Object.keys(rooms).forEach(roomId => {
        if (rooms[roomId]?.find(p => p.socketId === socket.id)) {
          handleLeave(socket, roomId);
        }
      });
    });

    function handleLeave(socket, roomId) {
      if (!rooms[roomId]) return;
      rooms[roomId] = rooms[roomId].filter(p => p.socketId !== socket.id);
      socket.to(roomId).emit('user-left', { socketId: socket.id });
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
}

startServer();