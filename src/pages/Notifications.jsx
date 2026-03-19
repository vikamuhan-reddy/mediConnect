import React from 'react';
import { Bell, Calendar, Clock, CheckCircle, Trash2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState([]);
  const [filter,  setFilter]  = React.useState('All');
  const [loading,    setLoading]    = React.useState(true);
  const [responding, setResponding] = React.useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const serverNotifs = res.data || [];

      // If server has real notifications use them,
      // otherwise fall back to generating from appointments
      if (serverNotifs.length > 0) {
        setNotifications(serverNotifs);
      } else {
        const apptsRes = await api.get('/appointments');
        const appointments = apptsRes.data?.appointments || apptsRes.data || [];
        const generated = appointments.map(appt => {
          const doctorName = appt.doctor_id?.name || appt.doctor?.name || 'Doctor';
          const patientName = appt.patient_id?.name || appt.patient?.name || '';
          const date = appt.date || '';
          const time = appt.time || '';
          let message = '';
          if (user?.role === 'guardian' && patientName) {
            message = `Appointment for ${patientName} with ${doctorName} on ${date} at ${time}.`;
          } else if (appt.status === 'upcoming') {
            message = `Appointment with ${doctorName} on ${date} at ${time}.`;
          } else if (appt.status === 'completed') {
            message = `Consultation with ${doctorName} on ${date} completed.`;
          } else {
            message = `Appointment with ${doctorName} on ${date} was ${appt.status}.`;
          }
          return {
            id: appt.id || appt._id,
            title: appt.status === 'upcoming' ? 'Upcoming Appointment' : 'Appointment Update',
            message,
            type: 'appointment',
            status: appt.status,
            read: false,
            date: appt.date || new Date().toISOString(),
          };
        });
        generated.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(generated);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchNotifications(); }, []);

  const handleRespond = async (requestId, action, notifId) => {
    setResponding(requestId);
    try {
      await api.post('/link/respond', { request_id: requestId, action });
      // Mark notification as read and resolved
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true, resolved: true } : n));
      // Show result message inline
      setNotifications(prev => [{
        id: 'response-' + Date.now(),
        title: action === 'accept' ? 'Guardian Linked' : 'Request Rejected',
        message: action === 'accept' ? 'Guardian has been linked. They can now view your health records.' : 'Guardian request has been rejected.',
        type: action === 'accept' ? 'link_accepted' : 'link_rejected',
        read: false,
        date: new Date().toISOString(),
      }, ...prev]);
    } catch (err) {
      console.error('Failed to respond:', err);
    } finally {
      setResponding(null);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
    } catch (_) {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (_) {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const filtered = filter === 'All'         ? notifications
                 : filter === 'Unread'      ? notifications.filter(n => !n.read)
                 : filter === 'Appointment' ? notifications.filter(n => n.type === 'appointment')
                 :                            notifications.filter(n => n.type === 'reminder');

  const unreadCount = notifications.filter(n => !n.read).length;

  const cardColor = (n) => {
    if (n.status === 'cancelled') return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800';
    if (n.status === 'completed') return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800';
  };

  const iconColor = (n) => {
    if (n.status === 'cancelled') return 'text-red-400 bg-red-100 dark:bg-red-900/40';
    if (n.status === 'completed') return 'text-green-500 bg-green-100 dark:bg-green-900/40';
    return 'text-blue-500 bg-blue-100 dark:bg-blue-900/40';
  };

  const IconCmp = (n) => {
    if (n.status === 'completed') return CheckCircle;
    if (n.type === 'reminder')    return Clock;
    return Calendar;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {user?.role === 'guardian'
              ? "Stay updated with your patients' health activities."
              : 'Stay updated with your health activities and alerts.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              <Check className="w-4 h-4" /> Mark all as read
            </button>
          )}
          <button onClick={clearAll} className="text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', 'Unread', 'Appointment', 'Reminder'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === tab
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            {tab}
            {tab === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-white text-emerald-600 text-xs rounded-full px-1.5 py-0.5 font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No notifications</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter === 'Unread' ? 'All caught up!' : 'Notifications will appear here when appointments are booked.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => {
            const isRead = notif.read;
            const Icon   = IconCmp(notif);
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                  notif.type === 'link_request' && !notif.resolved
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : cardColor(notif)
                } ${!isRead ? 'ring-1 ring-emerald-200 dark:ring-emerald-800' : ''}`}
                onClick={() => markOneRead(notif.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor(notif)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold mb-0.5 ${isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {notif.title}
                  </p>
                  <p className={`text-sm ${isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(notif.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {notif.status && ` · ${notif.status}`}
                  </p>
                  {/* Accept/Reject buttons for link requests */}
                  {notif.type === 'link_request' && !notif.resolved && notif.request_id && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleRespond(notif.request_id, 'accept', notif.id)}
                        disabled={responding === notif.request_id}
                        className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {responding === notif.request_id ? '...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => handleRespond(notif.request_id, 'reject', notif.id)}
                        disabled={responding === notif.request_id}
                        className="flex-1 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
                {!isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}