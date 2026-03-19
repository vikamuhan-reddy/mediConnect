import multer  from 'multer';
import fs      from 'fs';
import path    from 'path';
import Groq    from 'groq-sdk';
import ConsultationSummary from '../models/ConsultationSummary.js';

// ── Groq lazy init ────────────────────────────
let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

// ── Multer — save audio to uploads/ ──────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `consultation-${Date.now()}.webm`),
});
export const upload = multer({ storage });

// ── Structured summary prompt ─────────────────
const SUMMARY_PROMPT = `You are a medical assistant AI.
Analyze the following doctor-patient conversation and generate a structured medical summary.

STRICT RULES:
- Do NOT assume anything not mentioned
- If data is missing, use "Not mentioned"
- Return ONLY raw JSON — no markdown, no explanation

FORMAT:
{
  "chief_complaint": "",
  "symptoms": [],
  "diagnosis": "",
  "medications": [
    { "name": "", "dosage": "", "frequency": "" }
  ],
  "tests": [],
  "advice": "",
  "follow_up": ""
}`;

// ── POST /api/consultation/transcribe ─────────
export const transcribeAndSummarize = async (req, res) => {
  const audioPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    const { appointmentId, doctorId, patientId } = req.body;
    if (!appointmentId || !doctorId || !patientId) {
      return res.status(400).json({ error: 'appointmentId, doctorId, patientId are required.' });
    }

    // ── Step 1: Transcribe audio with Whisper ──
    console.log('[Consultation] Transcribing audio...');
    const transcription = await getGroq().audio.transcriptions.create({
      file:  fs.createReadStream(audioPath),
      model: 'whisper-large-v3',
    });
    const transcript = transcription.text?.trim();
    console.log('[Consultation] Transcript length:', transcript?.length);

    if (!transcript || transcript.length < 10) {
      return res.status(422).json({ error: 'Audio too short or unclear. Please try again.' });
    }

    // ── Step 2: Generate structured summary ───
    console.log('[Consultation] Generating summary...');
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens:  1024,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user',   content: `Conversation:\n${transcript}\n\nReturn ONLY JSON.` },
      ],
    });

    const raw     = completion.choices[0]?.message?.content?.trim() || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let summaryJson;
    try {
      summaryJson = JSON.parse(cleaned);
    } catch {
      console.error('[Consultation] JSON parse failed, raw:', cleaned.substring(0, 200));
      // Save raw text as fallback
      summaryJson = {
        chief_complaint: 'Could not parse',
        symptoms:        [],
        diagnosis:       cleaned.substring(0, 300),
        medications:     [],
        tests:           [],
        advice:          '',
        follow_up:       '',
      };
    }

    // ── Step 3: Save to DB ────────────────────
    const doc = await ConsultationSummary.create({
      appointmentId,
      doctorId,
      patientId,
      transcript,
      summary: JSON.stringify(summaryJson),
    });

    console.log('[Consultation] ✅ Summary saved:', doc._id);

    // Cleanup audio file
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    res.status(201).json({
      success:   true,
      summaryId: doc._id,
      summary:   summaryJson,
      transcript,
    });

  } catch (err) {
    console.error('[Consultation] Error:', err.message);
    if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/consultation/:id ─────────────────
export const getSummary = async (req, res) => {
  try {
    const doc = await ConsultationSummary.findById(req.params.id)
      .populate('doctorId',  'username specialization')
      .populate('patientId', 'username email');

    if (!doc) return res.status(404).json({ error: 'Summary not found.' });

    // Parse summary JSON if stored as string
    let summary = doc.summary;
    try {
      summary = typeof doc.summary === 'string' ? JSON.parse(doc.summary) : doc.summary;
    } catch { /* keep as string */ }

    res.json({
      _id:           doc._id,
      appointmentId: doc.appointmentId,
      doctor:        doc.doctorId,
      patient:       doc.patientId,
      transcript:    doc.transcript,
      summary,
      createdAt:     doc.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/consultation/history/:patientId ──
export const getPatientHistory = async (req, res) => {
  try {
    const docs = await ConsultationSummary.find({ patientId: req.params.patientId })
      .populate('doctorId', 'username specialization')
      .sort({ createdAt: -1 });

    const results = docs.map(doc => {
      let summary = doc.summary;
      try {
        summary = typeof doc.summary === 'string' ? JSON.parse(doc.summary) : doc.summary;
      } catch { /* keep as string */ }
      return {
        _id:           doc._id,
        appointmentId: doc.appointmentId,
        doctor:        doc.doctorId,
        summary,
        createdAt:     doc.createdAt,
      };
    });

    res.json({ success: true, consultations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/consultation/doctor/:doctorId ────
export const getDoctorHistory = async (req, res) => {
  try {
    const docs = await ConsultationSummary.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'username email')
      .sort({ createdAt: -1 });

    const results = docs.map(doc => {
      let summary = doc.summary;
      try {
        summary = typeof doc.summary === 'string' ? JSON.parse(doc.summary) : doc.summary;
      } catch { /* keep as string */ }
      return {
        _id:           doc._id,
        appointmentId: doc.appointmentId,
        patient:       doc.patientId,
        summary,
        createdAt:     doc.createdAt,
      };
    });

    res.json({ success: true, consultations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};