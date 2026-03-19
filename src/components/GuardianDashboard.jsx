import React from 'react';
import {
  Users, Calendar, Bell, Plus, Heart,
  Clock, Shield, Phone, Mail, AlertCircle,
  CheckCircle, Video, UserCheck, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppointmentCard from './AppointmentCard';

// ── Medical History Panel ─────────────────────────────────────────────────────
function PatientMedicalHistory({ patientId }) {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    api.get(`/medical-history?patient_id=${patientId}`)
      .then(res => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  const severityColor = (s) => {
    if (s === 'severe')   return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (s === 'moderate') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
  };

  if (loading) return <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />;

  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-red-500" /> Medical History
      </h3>
      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id || h._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{h.condition}</p>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${severityColor(h.severity)}`}>
                  {h.severity}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                {h.since    && <span>Since: {h.since}</span>}
                {h.duration && <span>· {h.duration}</span>}
              </div>
              {h.notes && <p className="text-xs text-slate-400 mt-1">{h.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">No medical history recorded by patient.</p>
        </div>
      )}
    </div>
  );
}

// ── Patient Health Card ───────────────────────────────────────────────────────
function PatientCard({ patient, appointments, isSelected, onClick }) {
  const pid          = patient.id || patient._id;
  const patientAppts = appointments.filter(a => {
    const apptPid = a.patient_id?.id || a.patient_id || a.user_id;
    return apptPid === pid;
  });
  const upcoming = patientAppts.filter(a => a.status === 'upcoming');
  const nextAppt = upcoming[0];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-3xl border p-6 transition-all hover:shadow-lg ${
        isSelected
          ? 'bg-emerald-600 border-emerald-600 shadow-xl shadow-emerald-200'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
      }`}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 ${
          isSelected
            ? 'bg-white/20 border-white/30 text-white'
            : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 text-emerald-600'
        }`}>
          {(patient.username || patient.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {patient.username || patient.name}
          </h3>
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
            <UserCheck className="w-3 h-3" /><span>Patient</span>
          </div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${upcoming.length > 0 ? 'bg-green-400' : 'bg-slate-300'}`} />
      </div>

      {/* Contact */}
      <div className={`space-y-1.5 mb-5 text-xs ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
        <div className="flex items-center gap-2"><Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{patient.email}</span></div>
        {patient.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 flex-shrink-0" /><span>{patient.phone}</span></div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
        {[
          { label: 'Upcoming', value: patientAppts.filter(a => a.status === 'upcoming').length,  color: isSelected ? 'text-white' : 'text-emerald-600' },
          { label: 'Done',     value: patientAppts.filter(a => a.status === 'completed').length, color: isSelected ? 'text-white' : 'text-blue-600'    },
          { label: 'Total',    value: patientAppts.length,                                       color: isSelected ? 'text-white' : 'text-purple-600'   },
        ].map(s => (
          <div key={s.label} className={`rounded-xl py-2 px-1 ${isSelected ? 'bg-white/15' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-[10px] font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Next appointment */}
      <div className={`rounded-2xl p-3 mb-4 text-xs ${isSelected ? 'bg-white/15' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
        <p className={`font-bold mb-1 ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>Next Appointment</p>
        {nextAppt ? (
          <p className={isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}>
            {nextAppt.doctor_id?.name || nextAppt.doctor?.name || 'Doctor'} · {nextAppt.date} {nextAppt.time}
          </p>
        ) : (
          <p className={isSelected ? 'text-emerald-200' : 'text-slate-400'}>None scheduled</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to="/doctors"
          onClick={e => e.stopPropagation()}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
            isSelected ? 'bg-white text-emerald-600 hover:bg-emerald-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          Book Appointment
        </Link>
        {nextAppt?.meeting_link && (
          <a
            href={nextAppt.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              isSelected ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Video className="w-3 h-3" /> Join
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function GuardianDashboard() {
  const { user }  = useAuth();
  const [dependents,    setDependents]    = React.useState([]);
  const [appointments,  setAppointments]  = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [selectedPid,   setSelectedPid]   = React.useState(null);
  const [loading,       setLoading]       = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [depRes, apptsRes, notifRes] = await Promise.all([
          api.get('/users/dependents'),
          api.get('/appointments'),
          api.get('/notifications'),
        ]);
        const deps  = depRes.data?.dependents || depRes.data || [];
        const appts = apptsRes.data?.appointments || apptsRes.data || [];
        setDependents(deps);
        setAppointments(appts);
        setNotifications(notifRes.data || []);
        if (deps.length > 0) setSelectedPid(deps[0].id || deps[0]._id);
      } catch (err) {
        console.error('GuardianDashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRescheduled = (updated) =>
    setAppointments(prev => prev.map(a => (a.id || a._id) === (updated.id || updated._id) ? updated : a));

  const handleCancelled = (id) =>
    setAppointments(prev => prev.map(a => (a.id || a._id) === id ? { ...a, status: 'cancelled' } : a));

  const totalUpcoming  = appointments.filter(a => a.status === 'upcoming').length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  const unreadNotifs   = notifications.filter(n => !n.read).length;

  const selectedPatient = dependents.find(d => (d.id || d._id) === selectedPid);
  const patientAppts    = selectedPid
    ? appointments.filter(a => {
        const pid = a.patient_id?.id || a.patient_id || a.user_id;
        return pid === selectedPid;
      })
    : [];
  const patientUpcoming  = patientAppts.filter(a => a.status === 'upcoming');
  const patientCompleted = patientAppts.filter(a => a.status === 'completed');
  const patientNotifs    = notifications.filter(n => n.user_id === selectedPid);

  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  // No patients linked
  if (dependents.length === 0) return (
    <div className="max-w-lg mx-auto mt-16 text-center space-y-6">
      <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">No Patients Linked</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You haven't linked any patients yet.</p>
        <p className="text-slate-400 text-sm mt-3">
          Go to <strong>Settings → Linked Accounts</strong> to add a patient, or ask your patient to enter your email
          (<span className="text-emerald-600 font-semibold">{user?.email}</span>) during their signup.
        </p>
      </div>
      <Link to="/settings" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
        <Users className="w-5 h-5" /> Go to Settings
      </Link>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Guardian Portal</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Welcome, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.username || user?.name}</span>.
            Managing <span className="font-semibold text-emerald-600">{dependents.length}</span> patient{dependents.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          to="/doctors"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" /> Book for Patient
        </Link>
      </div>

      {/* ── Overview Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients',      value: dependents.length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', Icon: Users        },
          { label: 'Upcoming',      value: totalUpcoming,     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',       Icon: Calendar     },
          { label: 'Completed',     value: totalCompleted,    color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20',   Icon: CheckCircle  },
          { label: 'Unread Alerts', value: unreadNotifs,      color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20',   Icon: Bell         },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.Icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Patient Cards ── */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-emerald-600" /> My Patients
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Click a patient card to view their appointments and alerts below</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dependents.map(dep => (
            <PatientCard
              key={dep.id || dep._id}
              patient={dep}
              appointments={appointments}
              isSelected={(dep.id || dep._id) === selectedPid}
              onClick={() => setSelectedPid(dep.id || dep._id)}
            />
          ))}
        </div>
      </section>

      {/* ── Selected Patient Detail Panel ── */}
      {selectedPatient && (
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">

          {/* Patient header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
                {(selectedPatient.username || selectedPatient.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-900 dark:text-white">
                  {selectedPatient.username || selectedPatient.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedPatient.email}</span>
                  {selectedPatient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedPatient.phone}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                {patientUpcoming.length} upcoming
              </span>
              <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                {patientCompleted.length} completed
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left: Appointments */}
              <div className="lg:col-span-2 space-y-6">

                {/* Upcoming appointments */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Upcoming Appointments
                  </h3>
                  {patientUpcoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patientUpcoming.map(appt => (
                        <AppointmentCard
                          key={appt.id || appt._id}
                          appointment={appt}
                          onRescheduled={handleRescheduled}
                          onCancelled={handleCancelled}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-200 dark:border-slate-600 rounded-2xl p-8 text-center">
                      <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                        No upcoming appointments for {selectedPatient.username || selectedPatient.name}.
                      </p>
                      <Link
                        to="/doctors"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Book Now
                      </Link>
                    </div>
                  )}
                </div>

                {/* Past appointments */}
                {patientCompleted.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-slate-400" /> Past Appointments
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patientCompleted.slice(0, 4).map(appt => (
                        <AppointmentCard
                          key={appt.id || appt._id}
                          appointment={appt}
                          onRescheduled={handleRescheduled}
                          onCancelled={handleCancelled}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Alerts + Medical History + tip */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    Patient Alerts
                    {patientNotifs.filter(n => !n.read).length > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {patientNotifs.filter(n => !n.read).length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {patientNotifs.slice(0, 5).length > 0 ? (
                      patientNotifs.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-2xl border relative overflow-hidden ${
                            n.read
                              ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                          }`}
                        >
                          {!n.read && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
                          <p className={`font-bold text-xs mb-1 ${n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {n.title}
                          </p>
                          <p className={`text-xs leading-relaxed ${n.read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-200 dark:border-slate-600 rounded-2xl p-5 text-center">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs">No alerts yet.</p>
                      </div>
                    )}
                    <Link
                      to="/notifications"
                      className="block text-center py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>

                {/* Medical History */}
                <PatientMedicalHistory patientId={selectedPid} />

                {/* Guardian tip */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-bold mb-2 text-sm">Guardian Tip</h3>
                    <p className="text-xs text-emerald-50 leading-relaxed">
                      Book regular checkups for your patients. Early detection keeps them healthier longer.
                    </p>
                    <Link to="/doctors" className="mt-3 inline-block text-xs font-bold text-white underline hover:no-underline">
                      Find a doctor →
                    </Link>
                  </div>
                  <Heart className="absolute -bottom-4 -right-4 w-20 h-20 text-white/10" />
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

    </div>
  );
}