import React from 'react';
import {
  Bell, Moon, Sun, Shield, Lock,
  Smartphone, Globe, Eye, EyeOff,
  ChevronRight, Check, X, UserPlus,
  Users, UserCheck, Unlink, Mail,
  AlertCircle, Loader, Heart, Plus,
  Trash2, Calendar, Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Reusable Toggle ───────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
        enabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-600'
      }`}
    >
      <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Medical History (Patient only) ───────────────────────────────────────────
function MedicalHistory() {
  const [history,  setHistory]  = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [saving,   setSaving]   = React.useState(false);
  const [message,  setMessage]  = React.useState({ type: '', text: '' });
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    condition:  '',
    since:      '',
    duration:   '',
    severity:   'mild',
    notes:      '',
  });

  const SEVERITY = ['mild', 'moderate', 'severe'];

  React.useEffect(() => {
    api.get('/medical-history')
      .then(res => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.condition.trim()) return showMsg('error', 'Please enter a condition/illness.');
    setSaving(true);
    try {
      const res = await api.post('/medical-history', form);
      setHistory(prev => [res.data, ...prev]);
      setForm({ condition: '', since: '', duration: '', severity: 'mild', notes: '' });
      setShowForm(false);
      showMsg('success', 'Medical history updated.');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/medical-history/${id}`);
      setHistory(prev => prev.filter(h => (h.id || h._id) !== id));
      showMsg('success', 'Entry removed.');
    } catch {
      showMsg('error', 'Failed to delete.');
    }
  };

  const severityColor = (s) => {
    if (s === 'severe')   return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800';
    if (s === 'moderate') return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800';
    return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader className="w-6 h-6 text-emerald-600 animate-spin" />
    </div>
  );

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Medical History</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your illnesses and conditions, visible to your doctor and guardian.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Entry</p>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Condition / Illness <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diabetes, Hypertension, Fever, Cold..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={form.condition}
              onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Since (year or date)
              </label>
              <input
                type="text"
                placeholder="e.g. 2020, Jan 2024, 3 days ago"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={form.since}
                onChange={e => setForm(p => ({ ...p, since: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Duration
              </label>
              <input
                type="text"
                placeholder="e.g. Ongoing, 1 week, 3 years"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Severity</label>
            <div className="flex gap-2">
              {SEVERITY.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, severity: s }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                    form.severity === s
                      ? severityColor(s) + ' border-current'
                      : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Additional Notes
            </label>
            <textarea
              placeholder="Any extra details your doctor should know..."
              rows={2}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      )}

      {/* History list */}
      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map(h => {
            const hid = h.id || h._id;
            return (
              <div key={hid} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{h.condition}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityColor(h.severity)}`}>
                      {h.severity}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {h.since    && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Since: {h.since}</span>}
                    {h.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {h.duration}</span>}
                  </div>
                  {h.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{h.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(hid)}
                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
          <Heart className="w-8 h-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No medical history added yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Add conditions like diabetes, hypertension, fever, cold, etc.
          </p>
        </div>
      )}
    </section>
  );
}

// ── Patient: link/unlink guardian ─────────────────────────────────────────────
function PatientLinkedAccounts() {
  const [linkedGuardian,  setLinkedGuardian]  = React.useState(null);
  const [guardianEmail,   setGuardianEmail]   = React.useState('');
  const [loading,         setLoading]         = React.useState(true);
  const [saving,          setSaving]          = React.useState(false);
  const [message,         setMessage]         = React.useState({ type: '', text: '' });
  const [pendingRequests, setPendingRequests] = React.useState([]);
  const [responding,      setResponding]      = React.useState(null);

  React.useEffect(() => {
    Promise.all([api.get('/link/status'), api.get('/link/requests')])
      .then(([statusRes, reqRes]) => {
        setLinkedGuardian(statusRes.data.guardian || null);
        setPendingRequests(reqRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (requestId, action) => {
    setResponding(requestId);
    try {
      const res = await api.post('/link/respond', { request_id: requestId, action });
      if (action === 'accept') {
        const statusRes = await api.get('/link/status');
        setLinkedGuardian(statusRes.data.guardian || null);
      }
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      showMsg('success', res.data.message);
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to respond.');
    } finally {
      setResponding(null);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  const handleLink = async () => {
    if (!guardianEmail.trim()) return showMsg('error', 'Please enter a guardian email.');
    setSaving(true);
    try {
      const res = await api.post('/link/guardian', { guardian_email: guardianEmail.trim() });
      setLinkedGuardian(res.data.guardian);
      setGuardianEmail('');
      showMsg('success', 'Guardian linked successfully!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'No guardian account found with that email.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    setSaving(true);
    try {
      await api.delete('/link/guardian');
      setLinkedGuardian(null);
      showMsg('success', 'Guardian unlinked.');
    } catch {
      showMsg('error', 'Failed to unlink guardian.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 text-emerald-600 animate-spin" /></div>;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Linked Guardian</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A linked guardian can view and manage your appointments on your behalf.</p>
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {linkedGuardian ? (
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {linkedGuardian.username?.charAt(0) || 'G'}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{linkedGuardian.username || 'Guardian'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{linkedGuardian.email}</p>
              <div className="flex items-center gap-1 mt-0.5"><UserCheck className="w-3 h-3 text-emerald-600" /><span className="text-xs font-bold text-emerald-600">Linked</span></div>
            </div>
          </div>
          <button onClick={handleUnlink} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
            <Unlink className="w-3.5 h-3.5" /> Unlink
          </button>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-center">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No guardian linked yet.</p>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Guardian Requests
          </p>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold text-lg flex-shrink-0">{req.guardian_name?.charAt(0) || 'G'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{req.guardian_name || 'Guardian'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{req.guardian_email}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Wants to be your guardian and view your health records.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRespond(req.id, 'accept')} disabled={responding === req.id}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                    {responding === req.id ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Accept
                  </button>
                  <button onClick={() => handleRespond(req.id, 'reject')} disabled={responding === req.id}
                    className="flex-1 py-2 border border-red-200 dark:border-red-800 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{linkedGuardian ? 'Change guardian' : 'Link a guardian'}</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" placeholder="guardian@example.com" value={guardianEmail}
              onChange={e => setGuardianEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLink()}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
          </div>
          <button onClick={handleLink} disabled={saving || !guardianEmail.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Link
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Guardian: linked patients ─────────────────────────────────────────────────
function GuardianLinkedAccounts() {
  const [patients,     setPatients]     = React.useState([]);
  const [requests,     setRequests]     = React.useState([]);
  const [patientEmail, setPatientEmail] = React.useState('');
  const [loading,      setLoading]      = React.useState(true);
  const [saving,       setSaving]       = React.useState(false);
  const [unlinking,    setUnlinking]    = React.useState(null);
  const [message,      setMessage]      = React.useState({ type: '', text: '' });

  React.useEffect(() => {
    Promise.all([api.get('/link/status'), api.get('/link/requests')])
      .then(([statusRes, reqRes]) => { setPatients(statusRes.data.dependents || []); setRequests(reqRes.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: '', text: '' }), 4000); };

  const handleSendRequest = async () => {
    if (!patientEmail.trim()) return showMsg('error', 'Please enter a patient email.');
    setSaving(true);
    try {
      const res = await api.post('/link/patient', { patient_email: patientEmail.trim() });
      setRequests(prev => [...prev, { patient_email: patientEmail.trim(), status: 'pending', id: Date.now() }]);
      setPatientEmail('');
      showMsg('success', res.data.message || 'Link request sent!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Could not send link request.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (patientId) => {
    setUnlinking(patientId);
    try {
      await api.delete(`/link/patient/${patientId}`);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      showMsg('success', 'Patient unlinked.');
    } catch { showMsg('error', 'Failed to unlink patient.'); }
    finally { setUnlinking(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 text-emerald-600 animate-spin" /></div>;

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Linked Patients</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send a link request to a patient. They must accept before you can view their health data.</p>
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
          {message.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {patients.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Accepted</p>
          <div className="space-y-3">
            {patients.map(patient => (
              <div key={patient.id || patient._id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">{patient.username?.charAt(0) || 'P'}</div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{patient.username || 'Patient'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{patient.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-lg flex items-center gap-1"><UserCheck className="w-3 h-3" /> Linked</span>
                  <button onClick={() => handleUnlink(patient.id || patient._id)} disabled={unlinking === (patient.id || patient._id)}
                    className="flex items-center gap-1 px-2 py-1 border border-red-200 dark:border-red-800 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                    {unlinking === (patient.id || patient._id) ? <Loader className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />} Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pending Requests</p>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 font-bold text-lg">{req.patient_email?.charAt(0).toUpperCase() || 'P'}</div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{req.patient_email}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Waiting for patient to accept...</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {patients.length === 0 && pendingRequests.length === 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-center">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No patients linked yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Send a request below — patient must accept it.</p>
        </div>
      )}

      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Send link request to patient</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" placeholder="patient@example.com" value={patientEmail}
              onChange={e => setPatientEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
          </div>
          <button onClick={handleSendRequest} disabled={saving || !patientEmail.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Send Request
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();

  const isPatient  = user?.role === 'patient';
  const isGuardian = user?.role === 'guardian';

  const [activeTab,       setActiveTab]       = React.useState('general');
  const [notifications,   setNotifications]   = React.useState({ email: true, push: true, sms: false });
  const [showPasswordForm,setShowPasswordForm]= React.useState(false);
  const [passwordData,    setPasswordData]    = React.useState({ current: '', next: '', confirm: '' });
  const [showPw,          setShowPw]          = React.useState({ current: false, next: false, confirm: false });
  const [pwMessage,       setPwMessage]       = React.useState({ type: '', text: '' });
  const [twoFA,           setTwoFA]           = React.useState(true);
  const [language,        setLanguage]        = React.useState('en');

  const toggleNotification = key => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handlePasswordSave = () => {
    if (!passwordData.current) return setPwMessage({ type: 'error', text: 'Enter your current password.' });
    if (passwordData.next.length < 6) return setPwMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
    if (passwordData.next !== passwordData.confirm) return setPwMessage({ type: 'error', text: 'Passwords do not match.' });
    setPwMessage({ type: 'success', text: 'Password updated successfully!' });
    setPasswordData({ current: '', next: '', confirm: '' });
    setTimeout(() => { setPwMessage({ type: '', text: '' }); setShowPasswordForm(false); }, 2000);
  };

  const tabs = [
    { id: 'general',  label: 'General',          icon: Bell   },
    { id: 'security', label: 'Security',          icon: Shield },
    { id: 'language', label: 'Language',          icon: Globe  },
    ...(isPatient || isGuardian ? [{ id: 'linked', label: 'Linked Accounts', icon: Users }] : []),
    ...(isPatient               ? [{ id: 'medical', label: 'Medical History', icon: Heart }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar nav */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                <Icon className="w-5 h-5" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">

          {activeTab === 'general' && (
            <>
              <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-700 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                      {darkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Dark Mode</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{darkMode ? 'Dark theme active' : 'Switch to dark theme'}</p>
                    </div>
                  </div>
                  <Toggle enabled={darkMode} onToggle={toggleDarkMode} />
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Notifications</h3>
                <div className="space-y-6">
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { id: 'push',  label: 'Push Notifications',  desc: 'Receive alerts on your device' },
                    { id: 'sms',   label: 'SMS Alerts',          desc: 'Receive critical updates via text' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                      <Toggle enabled={notifications[item.id]} onToggle={() => toggleNotification(item.id)} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'security' && (
            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Security</h3>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <button onClick={() => setShowPasswordForm(v => !v)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-600 rounded-xl text-slate-400"><Lock className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">Change Password</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Update your account security</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-300 dark:text-slate-500 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
                  </button>
                  {showPasswordForm && (
                    <div className="p-5 space-y-4 border-t border-slate-100 dark:border-slate-700">
                      {pwMessage.text && (
                        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${pwMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {pwMessage.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          {pwMessage.text}
                        </div>
                      )}
                      {[{ key: 'current', label: 'Current Password' }, { key: 'next', label: 'New Password' }, { key: 'confirm', label: 'Confirm New Password' }].map(field => (
                        <div key={field.key}>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{field.label}</label>
                          <div className="relative">
                            <input type={showPw[field.key] ? 'text' : 'password'} value={passwordData[field.key]}
                              onChange={e => setPasswordData(p => ({ ...p, [field.key]: e.target.value }))}
                              className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                              placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPw(p => ({ ...p, [field.key]: !p[field.key] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showPw[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-3 pt-1">
                        <button onClick={handlePasswordSave} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">Update Password</button>
                        <button onClick={() => { setShowPasswordForm(false); setPwMessage({ type: '', text: '' }); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-600 rounded-xl text-slate-400"><Smartphone className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Toggle enabled={twoFA} onToggle={() => setTwoFA(v => !v)} />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'language' && (
            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Language & Region</h3>
              <div className="space-y-3">
                {[
                  { code: 'en', label: 'English',  region: 'United States' },
                  { code: 'hi', label: 'Hindi',    region: 'India' },
                  { code: 'es', label: 'Spanish',  region: 'Spain / Latin America' },
                  { code: 'fr', label: 'French',   region: 'France' },
                  { code: 'de', label: 'German',   region: 'Germany' },
                  { code: 'zh', label: 'Chinese',  region: 'Simplified' },
                  { code: 'ar', label: 'Arabic',   region: 'Middle East' },
                  { code: 'ta', label: 'Tamil',    region: 'India / Sri Lanka' },
                ].map(lang => (
                  <button key={lang.code} onClick={() => setLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${language === lang.code ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'}`}>
                    <div className="text-left">
                      <p className={`font-bold text-sm ${language === lang.code ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{lang.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lang.region}</p>
                    </div>
                    {language === lang.code && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'linked' && (
            <>
              {isPatient  && <PatientLinkedAccounts />}
              {isGuardian && <GuardianLinkedAccounts />}
            </>
          )}

          {activeTab === 'medical' && isPatient && <MedicalHistory />}
        </div>
      </div>
    </div>
  );
}