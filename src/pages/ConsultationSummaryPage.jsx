import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, ChevronLeft, User, Stethoscope,
  Pill, TestTube, ClipboardList, Calendar,
  AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Section card ──────────────────────────────
function SummarySection({ icon: Icon, title, color, children }) {
  if (!children) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Tag chip ──────────────────────────────────
function Tag({ text }) {
  return (
    <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-xs font-medium">
      {text}
    </span>
  );
}

export default function ConsultationSummaryPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data,    setData]    = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState('');

  React.useEffect(() => {
    api.get(`/consultation/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError('Could not load summary.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center px-6">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 font-bold mb-2">{error}</p>
        <button onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  // Parse summary — could be string or object
  let summary = {};
  try {
    summary = typeof data?.summary === 'string'
      ? JSON.parse(data.summary)
      : (data?.summary || {});
  } catch { summary = {}; }

  const doctor  = data?.doctor;
  const patient = data?.patient;

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 pb-16">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Consultation Summary</h1>
              <p className="text-white/40 text-xs">
                {data?.createdAt
                  ? new Date(data.createdAt).toLocaleDateString('en-IN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })
                  : ''}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
            AI Generated
          </span>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Doctor</p>
              <p className="text-white text-sm font-bold">
                {doctor?.username || doctor?.name || 'Doctor'}
              </p>
              {doctor?.specialization && (
                <p className="text-white/40 text-xs">{doctor.specialization}</p>
              )}
            </div>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Patient</p>
              <p className="text-white text-sm font-bold">
                {patient?.username || patient?.name || 'Patient'}
              </p>
              {patient?.email && (
                <p className="text-white/40 text-xs truncate">{patient.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        {summary.chief_complaint && summary.chief_complaint !== 'Not mentioned' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1">Chief Complaint</p>
            <p className="text-white font-bold text-base">{summary.chief_complaint}</p>
          </div>
        )}

        {/* Symptoms */}
        {summary.symptoms?.length > 0 && (
          <SummarySection icon={AlertCircle} title="Symptoms" color="bg-orange-500">
            <div className="flex flex-wrap gap-2">
              {summary.symptoms.map((s, i) => <Tag key={i} text={s} />)}
            </div>
          </SummarySection>
        )}

        {/* Diagnosis */}
        {summary.diagnosis && summary.diagnosis !== 'Not mentioned' && (
          <SummarySection icon={Stethoscope} title="Diagnosis" color="bg-blue-600">
            <p className="text-white/80 text-sm leading-relaxed">{summary.diagnosis}</p>
          </SummarySection>
        )}

        {/* Medications */}
        {summary.medications?.length > 0 && (
          <SummarySection icon={Pill} title="Medications" color="bg-emerald-600">
            <div className="space-y-3">
              {summary.medications.map((med, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-white font-bold text-sm">{med.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {med.dosage    && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg">{med.dosage}</span>}
                      {med.frequency && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg">{med.frequency}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SummarySection>
        )}

        {/* Tests */}
        {summary.tests?.length > 0 && (
          <SummarySection icon={TestTube} title="Tests Ordered" color="bg-violet-600">
            <div className="flex flex-wrap gap-2">
              {summary.tests.map((t, i) => <Tag key={i} text={t} />)}
            </div>
          </SummarySection>
        )}

        {/* Advice */}
        {summary.advice && summary.advice !== 'Not mentioned' && (
          <SummarySection icon={ClipboardList} title="Advice" color="bg-teal-600">
            <p className="text-white/80 text-sm leading-relaxed">{summary.advice}</p>
          </SummarySection>
        )}

        {/* Follow-up */}
        {summary.follow_up && summary.follow_up !== 'Not mentioned' && (
          <SummarySection icon={Calendar} title="Follow-up" color="bg-pink-600">
            <p className="text-white/80 text-sm">{summary.follow_up}</p>
          </SummarySection>
        )}

        {/* Full Transcript */}
        {data?.transcript && (
          <details className="bg-slate-900 border border-white/10 rounded-2xl p-5 group">
            <summary className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white transition-colors list-none">
              <User className="w-4 h-4" />
              <span className="text-sm font-bold flex-1">View Full Transcript</span>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 pt-4 border-t border-white/10 text-white/60 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {data.transcript}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all">
            Back to Dashboard
          </button>
          <button onClick={() => window.print()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all">
            Print
          </button>
        </div>

      </div>
    </div>
  );
}