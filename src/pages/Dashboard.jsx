import React from 'react';
import { Link } from 'react-router-dom';
import { Video, X, Bell } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PatientDashboard from '../components/PatientDashboard';
import DoctorDashboard from '../components/DoctorDashboard';
import GuardianDashboard from '../components/GuardianDashboard';

// ── 30-min Reminder Toast ─────────────────────────────────────────────────────
function ReminderToast({ reminders, onDismiss }) {
  if (!reminders || reminders.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3 max-w-sm w-full">
      {reminders.map(appt => (
        <div
          key={appt.id}
          className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-2xl shadow-2xl shadow-emerald-100/50 p-4 flex items-start gap-4 animate-in slide-in-from-right"
        >
          {/* Icon */}
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-emerald-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Appointment in ~30 minutes!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {appt.doctor?.name
                ? `With ${appt.doctor.name}`
                : appt.patient?.name
                ? `Patient: ${appt.patient.name}`
                : 'Upcoming appointment'}
              {' · '}{appt.time}
            </p>
            {appt.meeting_link && (
              <a
                href={appt.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Video className="w-3 h-3" /> Join Call
              </a>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => onDismiss(appt.id)}
            className="p-1 text-slate-400 hover:text-slateate-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading,        setLoading]        = React.useState(true);
  const [reminderAppts,  setReminderAppts]  = React.useState([]);
  const [dismissedIds,   setDismissedIds]   = React.useState([]);

  // Load dashboard
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // ── 30-min reminder: check every 5 minutes ────────────────────────────────
  React.useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      try {
        const res = await api.get('/appointments/reminders');
        const due = (res.data || []).filter(a => !dismissedIds.includes(a.id));
        setReminderAppts(due);

        // Also trigger browser notification if permission granted
        if (due.length > 0 && 'Notification' in window) {
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
          if (Notification.permission === 'granted') {
            due.forEach(appt => {
              const key = `reminded-${appt.id}`;
              if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, '1');
                new Notification('MediConnect — Appointment Soon!', {
                  body: `${appt.doctor?.name
                    ? `Appointment with ${appt.doctor.name}`
                    : 'Your appointment'} at ${appt.time}`,
                  icon: '/favicon.ico',
                });
              }
            });
          }
        }
      } catch (_) {}
    };

    // Run immediately then every 5 minutes
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, dismissedIds]);

  const handleDismiss = (id) => {
    setDismissedIds(prev => [...prev, id]);
    setReminderAppts(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <>
      {/* 30-min reminder toasts */}
      <ReminderToast reminders={reminderAppts} onDismiss={handleDismiss} />

      {user?.role === 'doctor'   && <DoctorDashboard />}
      {user?.role === 'guardian' && <GuardianDashboard />}
      {user?.role === 'patient'  && <PatientDashboard />}
    </>
  );
}