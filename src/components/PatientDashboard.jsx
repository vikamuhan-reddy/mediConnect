import React from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Bell,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppointmentCard from './AppointmentCard';
import ReminderCard from './ReminderCard';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments,  setAppointments]  = React.useState([]);
  const [prescriptions, setPrescriptions] = React.useState([]);
  const [reminders,     setReminders]     = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [loading,       setLoading]       = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, remRes, notifRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/reminders'),
          api.get('/notifications')
        ]);
        setAppointments(apptsRes.data.appointments || apptsRes.data || []);
        setReminders(remRes.data || []);
        setNotifications(notifRes.data || []);
        setPrescriptions([]);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleReminder = (id) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: r.status === 'taken' ? 'pending' : 'taken' } : r)
    );
  };

  const handleRescheduled = (updated) => {
    setAppointments(prev =>
      prev.map(a => (a.id || a._id) === (updated.id || updated._id) ? updated : a)
    );
  };

  const handleCancelled = (id) => {
    setAppointments(prev =>
      prev.map(a => (a.id || a._id) === id ? { ...a, status: 'cancelled' } : a)
    );
  };

  const upcomingAppointments  = appointments.filter(a => a.status === 'upcoming');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const unreadNotifications   = notifications.filter(n => !n.read);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Dashboard</h1>
          <p className="text-slate-500">
            Welcome back, {user?.name || 'there'}! Here's what's happening with your health today.
          </p>
        </div>
        <Link
          to="/doctors"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Book New Appointment
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">{upcomingAppointments.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Upcoming</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{completedAppointments.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Completed</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-600">{prescriptions.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Prescriptions</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-orange-500">{unreadNotifications.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Unread Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Upcoming Appointments */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Upcoming Appointments
              </h2>
              <Link to="/appointments" className="text-sm font-semibold text-emerald-600 hover:underline">
                View all
              </Link>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.slice(0, 2).map(appt => (
                  <AppointmentCard
                    key={appt.id || appt._id}
                    appointment={appt}
                    onRescheduled={handleRescheduled}
                    onCancelled={handleCancelled}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No upcoming appointments scheduled.</p>
                <Link to="/doctors" className="text-emerald-600 font-bold hover:underline">
                  Find a doctor now
                </Link>
              </div>
            )}
          </section>

          {/* Recent Prescriptions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Recent Prescriptions
              </h2>
              <Link to="/prescriptions" className="text-sm font-semibold text-emerald-600 hover:underline">
                View all
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
              {prescriptions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {prescriptions.slice(0, 3).map(p => (
                    <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{p.medicine}</h4>
                          <p className="text-xs text-slate-500">{p.dosage} · {p.duration}</p>
                        </div>
                      </div>
                      <Link
                        to={`/prescriptions/${p.appointment_id}`}
                        className="p-2 text-slate-400 group-hover:text-emerald-600 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No prescriptions yet.</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Prescriptions from your doctors will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Past Appointments */}
          {completedAppointments.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  Past Appointments
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedAppointments.slice(0, 2).map(appt => (
                  <AppointmentCard
                    key={appt.id || appt._id}
                    appointment={appt}
                    onRescheduled={handleRescheduled}
                    onCancelled={handleCancelled}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">

          {/* Medicine Reminders */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Daily Reminders
              </h2>
              <Link to="/reminders" className="text-sm font-semibold text-emerald-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {reminders.length > 0 ? (
                reminders.map(r => (
                  <ReminderCard key={r.id} reminder={r} onToggle={toggleReminder} />
                ))
              ) : (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-400 text-sm">No reminders set.</p>
                  <Link to="/reminders" className="text-emerald-600 text-sm font-bold hover:underline mt-2 block">
                    Add a reminder
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Recent Notifications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notifications
                {unreadNotifications.length > 0 && (
                  <span className="ml-1 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </h2>
            </div>

            <div className="space-y-3">
              {notifications.slice(0, 3).length > 0 ? (
                notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-4 relative overflow-hidden">
                    {!n.read && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{n.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-400 text-sm">No notifications yet.</p>
                </div>
              )}

              <Link
                to="/notifications"
                className="block text-center py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </section>

          {/* Health Tip */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Health Tip of the Day</h3>
              <p className="text-sm text-emerald-50 leading-relaxed">
                Drinking at least 8 glasses of water daily helps maintain your energy levels and keeps your skin healthy.
              </p>
            </div>
            <ActivityIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
          </div>

        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}