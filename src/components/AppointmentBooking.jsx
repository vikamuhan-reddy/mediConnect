import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ChevronLeft, CheckCircle2, ArrowRight, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function AppointmentBooking() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [doctor,       setDoctor]       = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');
  const [loading,      setLoading]      = React.useState(true);
  const [booking,      setBooking]      = React.useState(false);
  const [success,      setSuccess]      = React.useState(false);
  const [error,        setError]        = React.useState('');

  // Guardian: list of linked patients + which one is selected
  const [patients,    setPatients]    = React.useState([]);
  const [patientId,   setPatientId]   = React.useState('');
  const isGuardian = user?.role === 'guardian';

  const timeSlots = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

  React.useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data.doctor || res.data);
      } catch (err) {
        setError('Could not load doctor details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  // Load linked patients if guardian
  React.useEffect(() => {
    if (!isGuardian) return;
    api.get('/users/dependents')
      .then(res => {
        const deps = res.data?.dependents || res.data || [];
        setPatients(deps);
        if (deps.length > 0) setPatientId(deps[0].id || deps[0]._id);
      })
      .catch(() => {});
  }, [isGuardian]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    if (isGuardian && !patientId) {
      setError('Please select a patient to book for.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const body = { doctor_id: id, date: selectedDate, time: selectedTime };
      if (isGuardian) body.patient_id = patientId;
      await api.post('/appointments', body);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const selectedPatient = patients.find(p => (p.id || p._id) === patientId);

  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  if (!doctor) return (
    <div className="text-center py-12 text-slate-500">
      {error || 'Doctor not found.'}
      <br />
      <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 font-bold hover:underline">
        Go back
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl shadow-slate-200/50">
        <AnimatePresence mode="wait">

          {/* ── Success Screen ── */}
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Appointment Booked!</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {isGuardian
                  ? `Appointment with ${doctor.name} booked for ${selectedPatient?.username || selectedPatient?.name || 'patient'}.`
                  : `Your session with ${doctor.name} has been successfully scheduled.`
                }
              </p>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 mb-8 text-left space-y-3">
                {isGuardian && selectedPatient && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Patient:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedPatient.username || selectedPatient.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Doctor:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{doctor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Time:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Type:</span>
                  <span className="font-bold text-emerald-600">Video Consultation</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/doctors')}
                  className="w-full py-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  Book another appointment
                </button>
              </div>
            </motion.div>

          ) : (

            /* ── Booking Form ── */
            <motion.div key="form" className="p-8">

              {/* Doctor Info Header */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
                {doctor.photo ? (
                  <img src={doctor.photo} alt={doctor.name} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-2xl font-bold border border-emerald-100">
                    {doctor.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{doctor.name}</h2>
                  <p className="text-sm text-emerald-600 font-medium">{doctor.specialization}</p>
                  {doctor.rating > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">⭐ {doctor.rating} · {doctor.experience} yrs exp</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-8">

                {/* ── Guardian: Patient Selector ── */}
                {isGuardian && (
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" /> Book for Patient
                    </label>
                    {patients.length === 0 ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-sm text-amber-700 dark:text-amber-400">
                        No patients linked to your account. Go to Settings → Linked Accounts to add a patient first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {patients.map(p => {
                          const pid = p.id || p._id;
                          const isSelected = patientId === pid;
                          return (
                            <button
                              key={pid}
                              onClick={() => setPatientId(pid)}
                              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                {(p.username || p.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                  {p.username || p.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p>
                              </div>
                              {isSelected && (
                                <div className="ml-auto w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-600" /> Select Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" /> Available Time Slots
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
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

                {/* Confirm Button */}
                <div className="pt-4">
                  <button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedTime || booking || (isGuardian && patients.length === 0)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {booking ? 'Processing...' : isGuardian ? `Book for ${selectedPatient?.username || selectedPatient?.name || 'Patient'}` : 'Confirm Appointment'}
                    {!booking && <ArrowRight className="w-5 h-5" />}
                  </button>
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                    By confirming, you agree to our terms of service and consultation fees.
                  </p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}