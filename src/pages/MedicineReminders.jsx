import React from 'react';
import { Pill, Plus, Clock, AlertCircle, Calendar, X, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

// ── Time label → emoji + icon map ────────────
const TIME_META = {
  morning:   { emoji: '🌅', label: 'Morning'   },
  afternoon: { emoji: '☀️',  label: 'Afternoon' },
  night:     { emoji: '🌙', label: 'Night'     },
};
const timeMeta = (t) => TIME_META[t?.toLowerCase()] ?? { emoji: '💊', label: t };

// ── Days left helper ──────────────────────────
const daysLeft = (endDate) =>
  Math.max(0, Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)));

// ── Individual Reminder Card ──────────────────
function ReminderCard({ reminder, onMark }) {
  const days     = daysLeft(reminder.endDate);
  const total    = reminder.todayStatus?.length ?? 0;
  const taken    = reminder.todayStatus?.filter((s) => s.taken).length ?? 0;
  const allDone  = total > 0 && taken === total;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-3xl border p-5 shadow-sm transition-all ${
        allDone
          ? 'border-emerald-200 bg-emerald-50/40'
          : days <= 2
          ? 'border-red-200'
          : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
            allDone ? 'bg-emerald-100' : 'bg-slate-100'
          }`}>
            <Pill className={`w-5 h-5 ${allDone ? 'text-emerald-600' : 'text-slate-500'}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              {reminder.medicineName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                {reminder.dosage}
              </span>
              {reminder.instructions && (
                <span className="text-xs text-slate-400">{reminder.instructions}</span>
              )}
            </div>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
          days <= 2
            ? 'bg-red-50 text-red-500'
            : days <= 5
            ? 'bg-amber-50 text-amber-600'
            : 'bg-slate-100 text-slate-500'
        }`}>
          {days}d left
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: total > 0 ? `${(taken / total) * 100}%` : '0%' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Dose buttons */}
      <div className="flex flex-wrap gap-2">
        {reminder.todayStatus?.map(({ time, taken: isTaken }) => {
          const { emoji, label } = timeMeta(time);
          return (
            <button
              key={time}
              disabled={isTaken}
              onClick={() => !isTaken && onMark(reminder._id, time)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold transition-all ${
                isTaken
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {isTaken && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────
export default function MedicineReminders() {
  const [reminders,   setReminders]   = React.useState([]);
  const [loading,     setLoading]     = React.useState(true);
  const [error,       setError]       = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newReminder, setNewReminder] = React.useState({
    medicineName: '', dosage: '', frequency: 'morning, night', duration: 5, instructions: '',
  });
  const [saving, setSaving] = React.useState(false);

  // ── Fetch from real API ───────────────────
  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/reminders');
      setReminders(data.reminders || []);
    } catch (err) {
      console.error('Failed to fetch reminders', err);
      setError('Failed to load reminders.');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchReminders(); }, []);

  // ── Mark a dose as taken ──────────────────
  const handleMark = async (reminderId, time) => {
    try {
      await api.post('/reminders/mark-taken', { reminderId, time });
      // Optimistic update — no flicker
      setReminders((prev) =>
        prev.map((r) =>
          r._id !== reminderId ? r : {
            ...r,
            todayStatus: r.todayStatus.map((s) =>
              s.time === time ? { ...s, taken: true } : s
            ),
          }
        )
      );
    } catch (err) {
      console.error('Mark taken error:', err);
    }
  };

  // ── Add reminder manually (patient self-add) ──
  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // POST to patient self-add endpoint
      await api.post('/reminders/self-add', newReminder);
      setIsModalOpen(false);
      setNewReminder({ medicineName: '', dosage: '', frequency: 'morning, night', duration: 5, instructions: '' });
      await fetchReminders(); // re-fetch to get server data
    } catch (err) {
      console.error('Add reminder error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ─────────────────────────────────
  const totalDoses = reminders.reduce((acc, r) => acc + (r.todayStatus?.length ?? 0), 0);
  const takenDoses = reminders.reduce((acc, r) => acc + (r.todayStatus?.filter((s) => s.taken).length ?? 0), 0);
  const progress   = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

  // ── Loading state ─────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Reminders</h1>
          <p className="text-slate-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {/* ── Progress Card ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular progress */}
          <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8"
                fill="transparent" className="text-slate-100" />
              <circle
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * progress) / 100}
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{Math.round(progress)}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Done</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Daily Progress</h3>
              <p className="text-slate-500">
                You've taken <span className="font-bold text-emerald-600">{takenDoses}</span> out of{' '}
                <span className="font-bold">{totalDoses}</span> doses today.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Taken</p>
                <p className="text-lg font-bold text-emerald-900">{takenDoses}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Remaining</p>
                <p className="text-lg font-bold text-amber-900">{totalDoses - takenDoses}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Medicines</p>
                <p className="text-lg font-bold text-blue-900">{reminders.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Reminders list */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Today's Schedule
          </div>

          <div className="space-y-4">
            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <ReminderCard key={reminder._id} reminder={reminder} onMark={handleMark} />
              ))
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No reminders for today.</p>
                <p className="text-slate-400 text-sm mt-1 mb-4">
                  Your doctor adds reminders via prescription, or add one manually.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-emerald-600 font-bold text-sm hover:underline"
                >
                  Add manually →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tips column */}
        <div className="space-y-6">
          <div className="bg-blue-600 rounded-3xl p-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">Important Note</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Always follow dosage instructions from your doctor. If you miss a dose, do not double the next one.
            </p>
          </div>

          {/* Ending soon */}
          {reminders.filter((r) => daysLeft(r.endDate) <= 3).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Ending Soon</h3>
              <div className="space-y-3">
                {reminders
                  .filter((r) => daysLeft(r.endDate) <= 3)
                  .map((r) => (
                    <div key={r._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Pill className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{r.medicineName}</span>
                      </div>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                        {daysLeft(r.endDate)}d left
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Reminder Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Add Reminder</h3>
                      <p className="text-sm text-slate-500">Schedule a new medication</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleAddReminder} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Medicine Name</label>
                    <input type="text" required placeholder="e.g. Paracetamol"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={newReminder.medicineName}
                      onChange={(e) => setNewReminder({ ...newReminder, medicineName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Dosage</label>
                      <input type="text" required placeholder="e.g. 500mg"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        value={newReminder.dosage}
                        onChange={(e) => setNewReminder({ ...newReminder, dosage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Duration (days)</label>
                      <input type="number" required min={1} max={365}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        value={newReminder.duration}
                        onChange={(e) => setNewReminder({ ...newReminder, duration: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Frequency</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
                    >
                      <option value="morning">Once daily (Morning)</option>
                      <option value="night">Once daily (Night)</option>
                      <option value="morning, night">Twice daily (Morning & Night)</option>
                      <option value="morning, afternoon, night">Three times daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Instructions (optional)</label>
                    <input type="text" placeholder="e.g. After meals"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={newReminder.instructions}
                      onChange={(e) => setNewReminder({ ...newReminder, instructions: e.target.value })}
                    />
                  </div>

                  <button type="submit" disabled={saving}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : '💊 Create Reminder'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}