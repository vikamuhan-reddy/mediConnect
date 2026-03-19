import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

export default function AppointmentBooking() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [doctor,       setDoctor]       = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');
  const [loading,      setLoading]      = React.useState(true);
  const [booking,      setBooking]      = React.useState(false);
  const [success,      setSuccess]      = React.useState(false);
  const [error,        setError]        = React.useState('');

  const timeSlots = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

  React.useEffect(() => {
    const fetchDoctor = async () => {
      try {
        // ✅ fixed — was GET /doctors then .find(), now fetches single doctor directly
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data.doctor || res.data);
      } catch (err) {
        console.error('Failed to fetch doctor', err);
        setError('Could not load doctor details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    setBooking(true);
    setError('');
    try {
      // ✅ fixed — was POST /appointment (singular), now POST /appointments
      await api.post('/appointments', {
        doctor_id: id,
        date: selectedDate,
        time: selectedTime
      });
      setSuccess(true);
    } catch (err) {
      // ✅ fixed — now shows error message instead of silent fail
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

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

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
        <AnimatePresence mode="wait">

          {/* Success Screen */}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Booked!</h2>
              <p className="text-slate-600 mb-8">
                Your session with {doctor.name} has been successfully scheduled.
              </p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-slate-900">{doctor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-900">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Time:</span>
                  <span className="font-bold text-slate-900">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type:</span>
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
                  className="w-full py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Book another appointment
                </button>
              </div>
            </motion.div>

          ) : (

            /* Booking Form */
            <motion.div key="form" className="p-8">

              {/* Doctor Info Header */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                {/* ✅ fixed — photo fallback if empty */}
                {doctor.photo ? (
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-16 h-16 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl font-bold border border-emerald-100">
                    {doctor.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{doctor.name}</h2>
                  <p className="text-sm text-emerald-600 font-medium">{doctor.specialization}</p>
                  {doctor.rating > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      ⭐ {doctor.rating} · {doctor.experience} yrs exp
                    </p>
                  )}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-8">

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-600" /> Select Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
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
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
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
                    disabled={!selectedDate || !selectedTime || booking}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {booking ? 'Processing...' : 'Confirm Appointment'}
                    {!booking && <ArrowRight className="w-5 h-5" />}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4">
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