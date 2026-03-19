import { Router }        from 'express';
import fs                from 'fs';
import axios             from 'axios';
import Groq              from 'groq-sdk';
import jwt               from 'jsonwebtoken';
import { createRequire } from 'module';
import Reminder          from '../models/Reminder.js';
import Prescription      from '../models/Prescription.js';

const require        = createRequire(import.meta.url);


const router = new Router();

// ── verifyToken inline ────────────────────────
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Access denied' });
  const token = header.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ── Groq lazy init ────────────────────────────
let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const EXTRACT_PROMPT = `Extract ALL medicines from this prescription.
Return ONLY a raw JSON array — no markdown, no explanation, no extra text.
Each item must have exactly:
- name: string
- dosage: string (e.g. "500mg")
- frequency: one of "morning" | "night" | "morning, night" | "morning, afternoon, night"
- duration: integer (days)
- instructions: string (e.g. "after meals" or "")
Example: [{"name":"Paracetamol","dosage":"500mg","frequency":"morning, night","duration":5,"instructions":"after meals"}]
If no medicines found return: []`;

// ── Strategy 1: extract text then send to Groq ──
async function tryTextExtraction(pdfBuffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    const text = fullText.trim();
    if (!text || text.length < 20) return null;
    console.log('[Scan] Text extracted, length:', text.length);

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user',   content: `Extract medicines:\n\n${text}` },
      ],
    });
    const raw     = completion.choices[0]?.message?.content?.trim() || '[]';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.log('[Scan] Text extraction failed:', err.message);
    return null;
  }
}

// ── Strategy 2: convert PDF to image, send to vision model ──
async function tryVisionExtraction(pdfBuffer) {
  try {
    console.log('[Scan] Trying vision extraction...');
    const { fromBuffer } = await import('pdf2pic');
    const convert = fromBuffer(pdfBuffer, {
      density: 200, format: 'png', width: 1200, height: 1600,
    });
    const page = await convert(1, { responseType: 'base64' });
    if (!page?.base64) throw new Error('pdf2pic returned no image');
    console.log('[Scan] PDF converted to image, sending to vision model...');
    const completion = await getGroq().chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${page.base64}` } },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      }],
    });
    const raw     = completion.choices[0]?.message?.content?.trim() || '[]';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    console.log('[Scan] Vision response:', cleaned.substring(0, 200));
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[Scan] Vision extraction failed:', err.message);
    return null;
  }
}

// ── Main: try text first, fall back to vision ──
async function extractMedicines(pdfBuffer) {
  const fromText = await tryTextExtraction(pdfBuffer);
  if (fromText && Array.isArray(fromText) && fromText.length > 0) {
    console.log('[Scan] ✅ Text extraction succeeded');
    return fromText;
  }
  console.log('[Scan] Falling back to vision...');
  return await tryVisionExtraction(pdfBuffer) || [];
}

// POST /api/prescriptions/scan-and-remind
router.post('/scan-and-remind', verifyToken, async (req, res) => {
  try {
    const extractOnly    = req.body.extractOnly === true || req.body.extractOnly === 'true';
    const prescriptionId = req.body.prescriptionId || req.body.fileId || null;

    // ── Mode A: save confirmed medicines as reminders ──
    if (!extractOnly && req.body.medicines) {
      const medicines = typeof req.body.medicines === 'string'
        ? JSON.parse(req.body.medicines)
        : req.body.medicines;

      const reminderDocs = medicines.map((med) => ({
        userId:        req.user.id,
        prescriptionId,
        medicineName:  med.name,
        dosage:        med.dosage,
        times:         med.frequency.split(',').map((t) => t.trim().toLowerCase()),
        startDate:     new Date(),
        endDate:       addDays(new Date(), Number(med.duration) || 7),
        instructions:  med.instructions || '',
        isActive:      true,
      }));

      await Reminder.insertMany(reminderDocs);
      return res.status(201).json({
        success: true, remindersCreated: reminderDocs.length, medicines,
        message: `${reminderDocs.length} reminder(s) created.`,
      });
    }

    // ── Get PDF buffer ──────────────────────────────
    let pdfBuffer = null;

    // Try PrescriptionFile model (binary stored in MongoDB)
    if (prescriptionId) {
      try {
        const { default: mongoose } = await import('mongoose');
        const PrescriptionFile = mongoose.model('PrescriptionFile');
        const fileRecord = await PrescriptionFile.findById(prescriptionId);
        if (fileRecord?.data) {
          pdfBuffer = fileRecord.data;
          console.log('[Scan] Got PDF from DB, size:', pdfBuffer.length);
        }
      } catch (e) {
        console.error('[Scan] DB fetch error:', e.message);
      }
    }

    // Try Prescription model fileUrl/filePath
    if (!pdfBuffer && prescriptionId) {
      try {
        const record = await Prescription.findById(prescriptionId);
        if (record?.fileUrl) {
          const response = await axios.get(record.fileUrl, { responseType: 'arraybuffer' });
          pdfBuffer = Buffer.from(response.data);
        } else if (record?.filePath) {
          pdfBuffer = fs.readFileSync(record.filePath);
        }
      } catch (e) {
        console.error('[Scan] Prescription model error:', e.message);
      }
    }

    // Try fileUrl passed directly in body
    if (!pdfBuffer && req.body.fileUrl) {
      const response = await axios.get(req.body.fileUrl, { responseType: 'arraybuffer' });
      pdfBuffer = Buffer.from(response.data);
    }

    if (!pdfBuffer) {
      return res.status(400).json({ success: false, message: 'Could not find the PDF file.' });
    }

    // ── Extract medicines (text → vision fallback) ──
    let medicines = [];
    try {
      medicines = await extractMedicines(pdfBuffer);
    } catch (err) {
      console.error('[Scan] Extraction error:', err);
      return res.status(422).json({
        success: false,
        message: 'Could not extract medicines from this prescription.',
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(200).json({
        success: true, remindersCreated: 0, medicines: [],
        message: 'No medicines detected in this prescription.',
      });
    }

    if (extractOnly) {
      return res.status(200).json({ success: true, medicines });
    }

    // Single-step: scan + save
    const reminderDocs = medicines.map((med) => ({
      userId:        req.user.id,
      prescriptionId,
      medicineName:  med.name,
      dosage:        med.dosage,
      times:         med.frequency.split(',').map((t) => t.trim().toLowerCase()),
      startDate:     new Date(),
      endDate:       addDays(new Date(), Number(med.duration) || 7),
      instructions:  med.instructions || '',
      isActive:      true,
    }));

    await Reminder.insertMany(reminderDocs);
    return res.status(201).json({
      success: true, remindersCreated: reminderDocs.length, medicines,
      message: `${reminderDocs.length} reminder(s) created.`,
    });

  } catch (err) {
    console.error('scan-and-remind error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;