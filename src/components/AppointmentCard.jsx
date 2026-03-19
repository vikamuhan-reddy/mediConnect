import React from 'react';
import { Calendar, Clock, Video, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:30 AM',
  '02:00 PM', '03:30 PM', '05:00 PM'
];

// ── Reschedule Modal ──────────────────────────────────────────────────────────
function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const [selectedDate, setSelectedDate] = React.useState(appointment.date || '');
  const [selectedTime, setSelectedTime] = React.useState(appointment.time || '');
  const [loading,      setLoading]      = React.useState(false);
  const [error,        setError]        = React.useState('');

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return setError('Please pick a date and time.');
    if (selectedDate === appointment.date && selectedTime === appointment.time)
      return setError('Please choose a different date or time.');
    setLoading(true);
    setError('');
    try {
      await api.patch(`/appointments/${appointment.id || appointment._id}`, {
        date: selectedDate,
        time: selectedTime,
      });
      onRescheduled({ ...appointment, date: selectedDate, time: selectedTime });
      onClose();
    } catch (err) {
      // Fallback: update locally if API fails
      onRescheduled({ ...appointment, date: selectedDate, time: selectedTime });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reschedule Appointment</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current: {appointment.date} at {appointment.time}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> New Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> New Time Slot
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTime === slot
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || loading}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : 'Confirm'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Confirm Modal ──────────────────────────────────────────────────────
function CancelModal({ appointment, onClose, onCancelled }) {
  const [loading, setLoading] = React.useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.id || appointment._id}`, { status: 'cancelled' });
      onCancelled(appointment.id || appointment._id);
      onClose();
    } catch (err) {
      onCancelled(appointment.id || appointment._id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cancel Appointment?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Are you sure you want to cancel your appointment
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6">
            {appointment.date} at {appointment.time}?
          </p>
          <p className="text-xs text-slate-400 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Keep it
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
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

// ── Main AppointmentCard ──────────────────────────────────────────────────────
export default function AppointmentCard({ appointment, onRescheduled, onCancelled }) {
  const { user } = useAuth();
  const [showReschedule, setShowReschedule] = React.useState(false);
  const [showCancel,     setShowCancel]     = React.useState(false);
  const [localAppt,      setLocalAppt]      = React.useState(appointment);

  React.useEffect(() => { setLocalAppt(appointment); }, [appointment]);

  const isUpcoming   = localAppt.status === 'upcoming';
  const isDoctor     = user?.role === 'doctor';
  const isGuardian   = user?.role === 'guardian';
  const isPatient    = user?.role === 'patient';

  // What name/subtitle to show on the card
  const displayName = isDoctor
    ? (localAppt.patient?.name || 'Patient')
    : (localAppt.doctor?.name || 'Doctor');
  const displaySub = isDoctor
    ? 'Patient'
    : localAppt.doctor?.specialization;

  const avatarInitial = isDoctor
    ? (localAppt.patient?.name?.charAt(0) || 'P')
    : (localAppt.doctor?.name?.charAt(0) || 'D');
  const hasPhoto = !isDoctor && localAppt.doctor?.photo;

  // Was this appointment booked by a guardian on behalf of the patient?
  const bookedByGuardian = localAppt.booked_by_guardian === true ||
    (localAppt.booked_by && localAppt.user_id && localAppt.booked_by !== localAppt.user_id);

  const handleRescheduled = (updated) => {
    setLocalAppt(updated);
    onRescheduled?.(updated);
  };
  const handleCancelled = (id) => {
    setLocalAppt(prev => ({ ...prev, status: 'cancelled' }));
    onCancelled?.(id);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors">

        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {hasPhoto ? (
              <img
                src={localAppt.doctor.photo}
                alt={displayName}
                className="w-12 h-12 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg font-bold border border-emerald-100 dark:border-emerald-800">
                {avatarInitial}
              </div>
            )}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{displayName}</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{displaySub}</p>

              {/* Guardian viewing: show which patient this is for */}
              {isGuardian && localAppt.patient?.name && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  For: {localAppt.patient.name}
                </p>
              )}

              {/* Patient viewing: show if a guardian booked this for them */}
              {isPatient && bookedByGuardian && (
                <p className="text-[10px] text-purple-500 dark:text-purple-400 font-bold uppercase tracking-wider mt-0.5">
                  Booked by Guardian{localAppt.booked_by_name ? ` (${localAppt.booked_by_name})` : ''}
                </p>
              )}
            </div>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
            isUpcoming
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : localAppt.status === 'cancelled'
              ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}>
            {localAppt.status}
          </span>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{localAppt.date}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{localAppt.time}</span>
          </div>
        </div>

        {/* Action buttons — upcoming only */}
        {/* Patient view — Join Call + Reschedule + Cancel */}
        {isUpcoming && !isDoctor && !isGuardian && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Link
                to={`/consultation/${localAppt.id || localAppt._id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                Join Call
              </Link>
              <button
                onClick={() => setShowReschedule(true)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Reschedule
              </button>
            </div>
            <button
              onClick={() => setShowCancel(true)}
              className="w-full py-2 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancel Appointment
            </button>
          </div>
        )}

        {/* Guardian view — optional Join Call + Reschedule + Cancel */}
        {isUpcoming && isGuardian && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Link
                to={`/consultation/${localAppt.id || localAppt._id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                Join as Guardian
              </Link>
              <button
                onClick={() => setShowReschedule(true)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Reschedule
              </button>
            </div>
            <button
              onClick={() => setShowCancel(true)}
              className="w-full py-2 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancel Appointment
            </button>
          </div>
        )}

        {/* Doctor view — just Join Call */}
        {isUpcoming && isDoctor && (
          <Link
            to={`/consultation/${localAppt.id || localAppt._id}`}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            <Video className="w-4 h-4" />
            Join Call
          </Link>
        )}

        {/* Completed / Cancelled */}
        {!isUpcoming && (
          <Link
            to={`/prescriptions/${localAppt.id || localAppt._id}`}
            className="w-full block text-center py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            View Prescription
          </Link>
        )}
      </div>

      {showReschedule && (
        <RescheduleModal
          appointment={localAppt}
          onClose={() => setShowReschedule(false)}
          onRescheduled={handleRescheduled}
        />
      )}
      {showCancel && (
        <CancelModal
          appointment={localAppt}
          onClose={() => setShowCancel(false)}
          onCancelled={handleCancelled}
        />
      )}
    </>
  );
}