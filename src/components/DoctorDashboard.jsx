import React from 'react';
import {
  Calendar, Users, FileText, Bell, Video,
  TrendingUp, Clock, X, ArrowRight, AlertTriangle,
  Heart, ClipboardPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // or whatever toast lib you use
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PrescriptionForm from '../components/PrescriptionForm';

// ── Medical Records Modal ─────────────────────────────────────────────────────
function MedicalRecordsModal({ patient, onClose }) {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!patient?.id) return;
    api.get(`/medical-history?patient_id=${patient.id}`)
      .then(res => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [patient]);

  const severityColor = (s) => {
    if (s === 'severe')   return 'bg-red-50 text-red-600 border-red-200';
    if (s === 'moderate') return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Medical Records</h2>
              <p className="text-xs text-slate-500">{patient?.name || 'Patient'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id || h._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm">{h.condition}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityColor(h.severity)}`}>
                      {h.severity}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-1">
                    {h.since    && <span>Since: {h.since}</span>}
                    {h.duration && <span>Duration: {h.duration}</span>}
                  </div>
                  {h.notes && <p className="text-xs text-slate-500 leading-relaxed">{h.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No medical history recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reschedule Modal ──────────────────────────────────────────────────────────
const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const [selectedDate, setSelectedDate] = React.useState(appointment.date || '');
  const [selectedTime, setSelectedTime] = React.useState(appointment.time || '');
  const [loading, setLoading] = React.useState(false);
  const [error,   setError]   = React.useState('');

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return setError('Please pick a date and time.');
    if (selectedDate === appointment.date && selectedTime === appointment.time)
      return setError('Please choose a different date or time.');
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.id || appointment._id}`, {
        date: selectedDate, time: selectedTime,
      });
    } catch (_) {}
    onRescheduled({ ...appointment, date: selectedDate, time: selectedTime });
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reschedule Appointment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Current: {appointment.date} at {appointment.time}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> New Date
            </label>
            <input type="date" min={new Date().toISOString().split('T')[0]}
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> New Time Slot
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map(slot => (
                <button key={slot} onClick={() => setSelectedTime(slot)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTime === slot
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selectedDate || !selectedTime || loading}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : 'Confirm'} {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ appointment, onClose, onCancelled }) {
  const [loading, setLoading] = React.useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.id || appointment._id}`, { status: 'cancelled' });
    } catch (_) {}
    onCancelled(appointment.id || appointment._id);
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cancel Appointment?</h2>
          <p className="text-sm text-slate-500 mb-1">Are you sure you want to cancel the appointment with</p>
          <p className="text-sm font-semibold text-slate-700 mb-1">{appointment.patient?.name || 'Patient'}</p>
          <p className="text-sm text-slate-500 mb-6">on {appointment.date} at {appointment.time}?</p>
          <p className="text-xs text-slate-400 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Keep it
            </button>
            <button onClick={handleCancel} disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Prescription Modal ────────────────────────────────────────────────────────
// Wraps PrescriptionForm in a modal overlay
function PrescriptionModal({ appointment, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button floating top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-xl shadow hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* ✅ PrescriptionForm placed here — gets patientId + appointmentId from the row */}
        <PrescriptionForm
          patientId={appointment.patient_id || appointment.patient?.id || appointment.patientId}
          appointmentId={appointment.id || appointment._id}
          onSuccess={(data) => {
            toast.success(`Prescription saved! ${data.remindersCreated} reminder${data.remindersCreated !== 1 ? 's' : ''} created.`);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

// ── Appointment Row ───────────────────────────────────────────────────────────
function AppointmentRow({ appt, onRescheduled, onCancelled }) {
  const [showReschedule,  setShowReschedule]  = React.useState(false);
  const [showCancel,      setShowCancel]      = React.useState(false);
  const [showRecords,     setShowRecords]     = React.useState(false);
  const [showPrescription, setShowPrescription] = React.useState(false); // ← NEW
  const [localAppt,       setLocalAppt]       = React.useState(appt);

  React.useEffect(() => { setLocalAppt(appt); }, [appt]);

  const isUpcoming = localAppt.status === 'upcoming';

  const handleRescheduled = (updated) => { setLocalAppt(updated); onRescheduled?.(updated); };
  const handleCancelled   = (id)      => {
    setLocalAppt(prev => ({ ...prev, status: 'cancelled' }));
    onCancelled?.(id);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:shadow-md transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Patient info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 text-lg font-bold flex-shrink-0">
              {localAppt.patient?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {localAppt.patient?.name || 'Patient'}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {localAppt.date} · {localAppt.time} · Online Consultation
              </p>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                localAppt.status === 'upcoming'
                  ? 'bg-emerald-50 text-emerald-600'
                  : localAppt.status === 'cancelled'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {localAppt.status}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Always visible */}
            <button onClick={() => setShowRecords(true)}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <Heart className="w-4 h-4" /> View Records
            </button>

            {/* Only for upcoming appointments */}
            {isUpcoming && (
              <>
                <Link to={`/consultation/${localAppt.id || localAppt._id}`}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" /> Join Call
                </Link>

                {/* ✅ NEW — Write Prescription button */}
                <button
                  onClick={() => setShowPrescription(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <ClipboardPlus className="w-4 h-4" /> Write Prescription
                </button>

                <button onClick={() => setShowReschedule(true)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Reschedule
                </button>
                <button onClick={() => setShowCancel(true)}
                  className="px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReschedule   && <RescheduleModal   appointment={localAppt} onClose={() => setShowReschedule(false)}   onRescheduled={handleRescheduled} />}
      {showCancel       && <CancelModal       appointment={localAppt} onClose={() => setShowCancel(false)}       onCancelled={handleCancelled} />}
      {showRecords      && <MedicalRecordsModal patient={localAppt.patient} onClose={() => setShowRecords(false)} />}

      {/* ✅ NEW */}
      {showPrescription && <PrescriptionModal appointment={localAppt} onClose={() => setShowPrescription(false)} />}
    </>
  );
}

// ── Main DoctorDashboard ──────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);

  React.useEffect(() => {
    api.get('/appointments')
      .then(res => setAppointments(res.data.appointments || res.data || []))
      .catch(err => console.error('Failed to fetch appointments', err))
      .finally(() => setLoading(false));
  }, []);

  const handleRescheduled = (updated) =>
    setAppointments(prev =>
      prev.map(a => (a.id || a._id) === (updated.id || updated._id) ? updated : a)
    );

  const handleCancelled = (id) =>
    setAppointments(prev =>
      prev.map(a => (a.id || a._id) === id ? { ...a, status: 'cancelled' } : a)
    );

  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const todayStr             = new Date().toISOString().split('T')[0];
  const todayAppointments    = appointments.filter(a => a.date === todayStr);

  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Doctor Portal</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back, Dr. {user?.name || 'Doctor'}.{' '}
          You have {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Patients</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {new Set(appointments.map(a => a.patient_id || a.patient?.id)).size}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>{appointments.length} total appointments</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Today's Appointments</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{todayAppointments.length}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-blue-600 text-xs font-bold">
            <Clock className="w-3 h-3" />
            <span>{upcomingAppointments[0] ? `Next: ${upcomingAppointments[0].time}` : 'No upcoming'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Upcoming</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{upcomingAppointments.length}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-purple-600 text-xs font-bold">
            <span>{appointments.filter(a => a.status === 'completed').length} completed</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Today's Schedule
            </h2>
          </div>
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map(appt => (
                <AppointmentRow
                  key={appt.id || appt._id}
                  appt={appt}
                  onRescheduled={handleRescheduled}
                  onCancelled={handleCancelled}
                />
              ))
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No appointments scheduled.</p>
                <p className="text-slate-400 text-sm mt-1">Appointments booked by patients will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-emerald-600" /> Recent Activity
            </h2>
            <div className="space-y-4">
              {appointments.slice(0, 3).length > 0 ? (
                appointments.slice(0, 3).map((appt, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{appt.patient?.name || 'Patient'}</h4>
                      <p className="text-xs text-slate-500">{appt.date} at {appt.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                  <div className="w-2 h-2 bg-slate-300 rounded-full mt-2" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">No recent activity</h4>
                    <p className="text-xs text-slate-500">Appointments will show here</p>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}