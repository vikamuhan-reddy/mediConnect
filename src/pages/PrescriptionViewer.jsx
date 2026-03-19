import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Printer, ChevronLeft,
  Pill, Stethoscope, Image as ImageIcon, ExternalLink,
  Eye, Upload, X, CheckCircle2, AlertCircle, Search,
  Plus, Users, Trash2, Sparkles, Loader2, ChevronRight  // ← add these 3
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Upload Panel (Doctor only) ───────────────────────────────────────────────
function DoctorUploadPanel({ onUploaded }) {
  const [file,          setFile]          = React.useState(null);
  const [notes,         setNotes]         = React.useState('');
  const [patientEmail,  setPatientEmail]  = React.useState('');
  const [appointments,  setAppointments]  = React.useState([]);
  const [selectedAppt,  setSelectedAppt]  = React.useState(''); // appointment id or 'direct'
  const [uploading,     setUploading]     = React.useState(false);
  const [success,       setSuccess]       = React.useState(false);
  const [error,         setError]         = React.useState('');
  const [dragOver,      setDragOver]      = React.useState(false);
  const [loadingAppts,  setLoadingAppts]  = React.useState(true);
  const fileInputRef = React.useRef(null);

  // Fetch doctor's appointments to pick patient from
  React.useEffect(() => {
    api.get('/appointments')
      .then(res => {
        const list = res.data?.appointments || res.data || [];
        setAppointments(list);
      })
      .catch(() => {})
      .finally(() => setLoadingAppts(false));
  }, []);

  const validateAndSet = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) return setError('Only PDF, JPG, PNG files are allowed.');
    if (f.size > 5 * 1024 * 1024)  return setError('File must be under 5MB.');
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.');
    if (selectedAppt === '' && !patientEmail.trim())
      return setError('Select an appointment or enter a patient email.');
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('prescription', file);
      formData.append('notes', notes);
      if (selectedAppt && selectedAppt !== 'direct') {
        formData.append('appointment_id', selectedAppt);
      } else {
        formData.append('patient_email', patientEmail.trim());
      }
      const res = await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      onUploaded?.(res.data);
      // reset after 3s
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setNotes('');
        setPatientEmail('');
        setSelectedAppt('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
          <Upload className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Prescription</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload a PDF or image prescription for any patient
          </p>
        </div>
      </div>

      {success ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-lg">Prescription Uploaded!</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            The patient has been notified and can now view it.
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Step 1: Choose patient */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Step 1 — Select Patient
            </label>

            {/* From appointments */}
            <div className="mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                From your appointments:
              </p>
              {loadingAppts ? (
                <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
              ) : appointments.length > 0 ? (
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={selectedAppt}
                  onChange={e => { setSelectedAppt(e.target.value); setPatientEmail(''); }}
                >
                  <option value="">-- Select an appointment --</option>
                  {appointments.map(a => (
                    <option key={a.id || a._id} value={a.id || a._id}>
                      {a.patient?.name || 'Patient'} · {a.date} {a.time} · {a.status}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No appointments found.</p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-bold">OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Direct patient email */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                Enter patient email directly:
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="patient@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={patientEmail}
                  onChange={e => { setPatientEmail(e.target.value); setSelectedAppt('direct'); }}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Upload file */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Step 2 — Choose File
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : file
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Drop file here or <span className="text-emerald-600 font-bold">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG · Max 5MB</p>
                </>
              )}
            </div>
          </div>

          {/* Step 3: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Notes for patient (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Take after meals, complete the full course..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading || (selectedAppt === '' && !patientEmail.trim())}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Prescription
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
// ── AI Scan Panel ─────────────────────────────
function AIScanPanel({ file, onDone }) {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = React.useState('scanning');
  const [medicines,  setMedicines]  = React.useState([]);
  const [scanError,  setScanError]  = React.useState('');
  const [creating,   setCreating]   = React.useState(false);

  React.useEffect(() => { runScan(); }, []);

  const runScan = async () => {
    setScanStatus('scanning');
    setScanError('');
    try {
      const { data } = await api.post('/prescriptions/scan-and-remind', {
        fileId: file._id || file.id,
        prescriptionId: file._id || file.id,
        extractOnly: true,
      });
      if (!data.medicines?.length) { setScanStatus('empty'); return; }
      setMedicines(data.medicines);
      setScanStatus('preview');
    } catch (err) {
      setScanError(err.response?.data?.message || 'Scan failed. Try again.');
      setScanStatus('error');
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/prescriptions/scan-and-remind', {
        prescriptionId: file._id || file.id,
        extractOnly: false,
        medicines,
      });
      setScanStatus('done');
      onDone?.();
    } catch (err) {
      setScanError('Failed to create reminders.');
      setScanStatus('error');
    } finally {
      setCreating(false);
    }
  };

  if (scanStatus === 'scanning') return (
    <div className="mt-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
      <div>
        <p className="font-bold text-blue-800 text-sm">Scanning with AI…</p>
        <p className="text-xs text-blue-600">Reading medicines, dosage & frequency</p>
      </div>
    </div>
  );

  if (scanStatus === 'error') return (
    <div className="mt-3 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-700 font-medium">{scanError}</p>
    </div>
  );

  if (scanStatus === 'empty') return (
    <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <div>
        <p className="font-bold text-amber-800 text-sm">No medicines detected</p>
        <p className="text-xs text-amber-600">PDF may be a scanned image — needs text-based PDF.</p>
      </div>
    </div>
  );

  if (scanStatus === 'done') return (
    <div className="mt-3 space-y-2">
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="font-bold text-emerald-800 text-sm">
          {medicines.length} reminder{medicines.length !== 1 ? 's' : ''} created!
        </p>
      </div>
      <button
        onClick={() => navigate('/reminders')}
        className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
      >
        View My Reminders <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  // preview
  return (
    <div className="mt-3 space-y-3">
      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <p className="font-bold text-blue-800 text-sm">AI found {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}</p>
        </div>
        <p className="text-xs text-blue-600">Review below then confirm.</p>
      </div>

      <div className="space-y-2">
        {medicines.map((med, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
            <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{med.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">{med.dosage}</span>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg font-semibold">{med.frequency}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{med.duration}d</span>
                {med.instructions && <span className="text-xs text-slate-400 italic">{med.instructions}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={creating}
        className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {creating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
          : <><CheckCircle2 className="w-4 h-4" /> Create {medicines.length} Reminder{medicines.length !== 1 ? 's' : ''}</>
        }
      </button>
    </div>
  );
}

// ── File Card ─────────────────────────────────────────────────────────────────
function FileCard({ file, onPreview, onDelete, canDelete }) {
  const isPDF   = file.mimetype === 'application/pdf' || file.filename?.endsWith('.pdf');
  const isImage = file.mimetype?.startsWith('image/');
  const [showScan, setShowScan] = React.useState(false);
const [scanDone, setScanDone] = React.useState(false);
const [deleting, setDeleting] = React.useState(false);

  const [previewUrl, setPreviewUrl] = React.useState(null);

const handlePreview = () => {
  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token');
  fetch(`${BACKEND}/api/prescriptions/download/${file._id || file.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onPreview({ ...file, blobUrl: url });
    });
};

const handleDownload = () => {
  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token');
  fetch(`${BACKEND}/api/prescriptions/download/${file._id || file.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename || 'prescription';
      a.click();
      URL.revokeObjectURL(url);
    });
};

  const handleDelete = async () => {
    if (!window.confirm('Delete this prescription? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/prescriptions/files/${file._id || file.id}`);
      onDelete?.(file._id || file.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPDF ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
        }`}>
          {isPDF ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
            {file.filename || 'prescription'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {file.size ? `${(file.size / 1024).toFixed(1)} KB · ` : ''}
            {new Date(file.uploadedAt || file.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
          {file.patientName && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              Patient: {file.patientName}
            </p>
          )}
          {file.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5 leading-relaxed">
              {file.notes}
            </p>
          )}
        </div>
        {/* Delete button — doctor only */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
            title="Delete prescription"
          >
            {deleting
              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
              : <Trash2 className="w-4 h-4" />
            }
          </button>
        )}
      <div className="flex gap-2 mt-4">
        {isImage && (
          <button onClick={() => onPreview(file)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        )}
        <button onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" /> Download Pdf
        </button>

        {/* ✅ NEW — only show for PDFs, not images */}
        {isPDF && (
          <button
            onClick={() => setShowScan(s => !s)}
            disabled={scanDone}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              scanDone
                ? 'bg-emerald-50 text-emerald-600 cursor-default'
                : showScan
                ? 'bg-purple-100 text-purple-700'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
          >
            {scanDone
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Done</>
              : <><Sparkles className="w-3.5 h-3.5" /> Scan with AI</>
            }
          </button>
        )}
      </div>

      {/* ✅ NEW — AI scan panel slides in below */}
      {showScan && !scanDone && (
        <AIScanPanel
          file={file}
          onDone={() => { setScanDone(true); setShowScan(false); }}
        />
      )}
      </div>
    </div>
  );
}

// ── Main PrescriptionViewer ───────────────────────────────────────────────────
export default function PrescriptionViewer() {
  const { appointmentId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();

  const [prescriptions, setPrescriptions] = React.useState([]);
  const [uploadedFiles,  setUploadedFiles]  = React.useState([]);
  const [loading,        setLoading]        = React.useState(true);
  const [previewFile,    setPreviewFile]    = React.useState(null);

  const isDoctor = user?.role === 'doctor';

  const fetchAll = React.useCallback(async () => {
    try {
      // Structured prescriptions (text-based)
      const res = await api.get('/prescriptions');
      const data = res.data || [];
      const filtered = appointmentId
        ? data.filter(p => p.appointment_id === appointmentId)
        : data;
      setPrescriptions(filtered);

      // Uploaded prescription files
      const filesUrl = appointmentId
        ? `/prescriptions/files/${appointmentId}`
        : '/prescriptions/files';
      const filesRes = await api.get(filesUrl);
      setUploadedFiles(filesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
      setPrescriptions([]);
      setUploadedFiles([]);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUploaded = (newFile) => {
    setUploadedFiles(prev => [newFile, ...prev]);
  };

  const handleDeleted = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => (f._id || f.id) !== fileId));
  };

  const hasAnything = prescriptions.length > 0 || uploadedFiles.length > 0;

  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewFile(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white font-bold text-sm">
              Close ✕
            </button>
            <img
             src={previewFile.blobUrl}
              alt="Prescription"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        
      </div>

      {/* ── Doctor Upload Panel ── */}
      {isDoctor && (
        <DoctorUploadPanel onUploaded={handleUploaded} />
      )}

      {/* ── Uploaded Files Grid ── */}
      {uploadedFiles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {isDoctor ? 'Uploaded Prescriptions' : 'Your Prescription Files'}
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {uploadedFiles.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedFiles.map(file => (
              <FileCard
                key={file._id || file.id}
                file={file}
                onPreview={setPreviewFile}
                canDelete={isDoctor}
                onDelete={handleDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Structured Prescriptions ── */}
      {prescriptions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                <Stethoscope className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MediConnect Clinic</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">123 Healthcare Ave, Medical District</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm mb-2">
                E-Prescription
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            {prescriptions.map((p, idx) => (
              <div key={p.id || p._id} className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {p.medicine}
                    </h4>
                    <p className="text-emerald-600 font-bold">{p.dosage}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Frequency</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{p.frequency}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{p.duration}</p>
                    </div>
                  </div>
                </div>
                {p.instructions && (
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="text-slate-400 mr-2">Instructions:</span>{p.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!hasAnything && !isDoctor && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl">
          <div className="p-16 text-center">
            <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Prescriptions Yet</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Prescriptions will appear here after your consultation.
            </p>
          </div>
        </div>
      )}

      {/* Doctor empty state — no uploads yet but panel is shown */}
      {!hasAnything && isDoctor && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            No prescriptions uploaded yet. Use the form above to upload one.
          </p>
        </div>
      )}
    </div>
  );
}