import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Mail, Phone, LogOut, Camera,
  Shield, Check, X, Edit2, Upload, Users,
  Stethoscope, Building2, Clock, DollarSign, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SPECIALIZATIONS = [
  'Cardiologist','Dermatologist','Pediatrician','Neurologist',
  'Orthopedic','Nephrologist','Endocrinologist','Psychiatrist',
  'Ophthalmologist','Pulmonologist','Gastroenterologist','Oncologist',
  'Gynecologist','ENT Specialist','Urologist','Rheumatologist',
  'General Physician',
];

// ── Avatar helpers ─────────────────────────────────────────────────────────────
const AVATAR_STYLES = [
  { label: 'Avatars',    style: 'avataaars'  },
  { label: 'Pixel Art',  style: 'pixel-art'  },
  { label: 'Lorelei',    style: 'lorelei'    },
  { label: 'Notionists', style: 'notionists' },
  { label: 'Adventurer', style: 'adventurer' },
];
const SEEDS = ['Felix','Loki','Midnight','Zara','Nova','Atlas','Luna','Orion','Sage','River','Echo','Storm'];
const avatarUrl = (style, seed) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

// ── Avatar Picker Modal ───────────────────────────────────────────────────────
function AvatarPickerModal({ currentAvatar, onSelect, onClose }) {
  const [activeStyle,    setActiveStyle]    = React.useState(AVATAR_STYLES[0]);
  const [selected,       setSelected]       = React.useState(currentAvatar || '');
  const [uploadPreview,  setUploadPreview]  = React.useState(null);
  const fileRef = React.useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadPreview(ev.target.result); setSelected(ev.target.result); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Choose Your Avatar</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto pb-1">
          {AVATAR_STYLES.map(s => (
            <button key={s.style} onClick={() => { setActiveStyle(s); setUploadPreview(null); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeStyle.style === s.style ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>{s.label}</button>
          ))}
        </div>
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            {SEEDS.map(seed => {
              const url = avatarUrl(activeStyle.style, seed);
              const isActive = selected === url;
              return (
                <button key={seed} onClick={() => { setSelected(url); setUploadPreview(null); }}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    isActive ? 'border-emerald-500 shadow-lg scale-105' : 'border-transparent hover:border-slate-200'
                  }`}>
                  <img src={url} alt={seed} className="w-full h-full object-cover bg-slate-50" loading="lazy" />
                  {isActive && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-2">
          <div className="flex-1 h-px bg-slate-100" /><span className="text-xs text-slate-400 font-semibold">OR</span><div className="flex-1 h-px bg-slate-100" />
        </div>
        <div className="px-6 pb-4">
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
            <Upload className="w-4 h-4" /> Upload your own photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {uploadPreview && (
            <div className="flex items-center gap-3 mt-3 p-3 bg-emerald-50 rounded-2xl">
              <img src={uploadPreview} alt="preview" className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-200" />
              <p className="text-xs font-bold text-emerald-700 flex-1">Custom photo selected</p>
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => { if (selected) onSelect(selected); onClose(); }} disabled={!selected}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
            Apply Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [isEditing,  setIsEditing]  = React.useState(false);
  const [showPicker, setShowPicker] = React.useState(false);
  const [loading,    setLoading]    = React.useState(false);
  const [message,    setMessage]    = React.useState({ type: '', text: '' });
  const [linkedGuardian,  setLinkedGuardian]  = React.useState(null);
  const [linkedPatients,  setLinkedPatients]  = React.useState([]);
  const [linkLoading,     setLinkLoading]     = React.useState(false);

  const [formData, setFormData] = React.useState({
    name:           '',
    email:          '',
    phone:          '',
    specialization: '',
    hospital:       '',
    experience:     '',
    fee:            '',
  });

  const currentAvatar = user?.avatar || avatarUrl('avataaars', user?.name || 'user');
  const isDoctor   = user?.role === 'doctor';
  const isPatient  = user?.role === 'patient';
  const isGuardian = user?.role === 'guardian';

  // Fetch linked guardian (patient) or linked patients (guardian)
  React.useEffect(() => {
    if (!isPatient && !isGuardian) return;
    setLinkLoading(true);
    api.get('/link/status')
      .then(res => {
        console.log('[Profile] link/status response:', res.data);
        if (isPatient)  setLinkedGuardian(res.data?.guardian   || null);
        if (isGuardian) setLinkedPatients(res.data?.dependents || []);
      })
      .catch(err => console.error('[Profile] link/status error:', err))
      .finally(() => setLinkLoading(false));
  }, [isPatient, isGuardian]);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name:           user.name           || '',
        email:          user.email          || '',
        phone:          user.phone          || '',
        specialization: user.specialization || '',
        hospital:       user.hospital       || '',
        experience:     user.experience     || '',
        fee:            user.fee            || '',
      });
    }
  }, [user]);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { name: formData.name, phone: formData.phone };
      if (isDoctor) {
        payload.specialization = formData.specialization;
        payload.hospital       = formData.hospital;
        payload.experience     = Number(formData.experience) || 0;
        payload.fee            = Number(formData.fee)        || 0;
      }
      const res = await api.put('/users/profile', payload);
      updateUser({ ...user, ...res.data.user });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (url) => {
    updateUser({ ...user, avatar: url });
    setMessage({ type: 'success', text: 'Avatar updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2500);
  };

  if (!user) return null;

  const inputCls = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-20 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-xl shadow-slate-200/50">

          {/* Top row */}
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-emerald-100 border-4 border-white shadow-lg overflow-hidden">
                  <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover bg-slate-50" />
                </div>
                <button onClick={() => setShowPicker(true)}
                  className="absolute bottom-2 right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
                <div onClick={() => setShowPicker(true)}
                  className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name || user.username}</h1>
                <p className="text-emerald-600 font-bold text-sm capitalize">{user.role}</p>
                {isDoctor && user.specialization && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{user.specialization}</p>
                )}
                {isDoctor && user.hospital && (
                  <p className="text-slate-400 text-xs mt-0.5">{user.hospital}</p>
                )}
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> {user.email}
                </p>
              </div>
            </div>

            {/* Edit / Save */}
            <div className="flex gap-3 w-full md:w-auto">
              {isEditing ? (
                <>
                  <button onClick={handleSave} disabled={loading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
                    <Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditing(false)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

            {/* Personal Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-600" /> Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  {isEditing ? (
                    <input type="text" className={inputCls} value={formData.name}
                      onChange={e => set('name', e.target.value)} />
                  ) : (
                    <p className="text-slate-900 dark:text-white font-medium">{user.name || user.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <p className="text-slate-900 dark:text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  {isEditing ? (
                    <input type="tel" className={inputCls} value={formData.phone}
                      onChange={e => set('phone', e.target.value)} />
                  ) : (
                    <p className="text-slate-900 dark:text-white font-medium">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Doctor: Professional Details */}
              {isDoctor ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-600" /> Professional Details
                  </h3>
                  <div className="space-y-4">

                    {/* Specialization */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialization</label>
                      {isEditing ? (
                        <div className="relative">
                          <select className={inputCls + ' pr-8'} value={formData.specialization}
                            onChange={e => set('specialization', e.target.value)}>
                            <option value="">Select specialization</option>
                            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      ) : (
                        <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-emerald-600" />
                          {user.specialization || 'Not set'}
                        </p>
                      )}
                    </div>

                    {/* Hospital */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hospital / Clinic</label>
                      {isEditing ? (
                        <input type="text" className={inputCls} placeholder="Apollo Hospital" value={formData.hospital}
                          onChange={e => set('hospital', e.target.value)} />
                      ) : (
                        <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {user.hospital || 'Not set'}
                        </p>
                      )}
                    </div>

                    {/* Experience + Fee */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience (yrs)</label>
                        {isEditing ? (
                          <input type="number" min="0" max="60" className={inputCls} value={formData.experience}
                            onChange={e => set('experience', e.target.value)} />
                        ) : (
                          <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            {user.experience ? `${user.experience} yrs` : 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consultation Fee</label>
                        {isEditing ? (
                          <input type="number" min="0" className={inputCls} value={formData.fee}
                            onChange={e => set('fee', e.target.value)} />
                        ) : (
                          <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            {user.fee ? `₹${user.fee}` : 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Completion nudge */}
                    {!isEditing && (!user.specialization || !user.hospital) && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-medium">
                        ⚠️ Complete your profile so patients can find and book you.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Non-doctor: Account Security + Linked Accounts */
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" /> Account Security
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Role</p>
                      <p className="text-xs text-slate-500 capitalize">{user.role} account</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg capitalize">
                      {user.role}
                    </span>
                  </div>

                  {/* Patient: show linked guardian */}
                  {isPatient && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Linked Guardian</p>
                      {linkLoading ? (
                        <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
                      ) : linkedGuardian ? (
                        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
                          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(linkedGuardian.username || linkedGuardian.name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {linkedGuardian.username || linkedGuardian.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {linkedGuardian.email}
                            </p>
                            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mt-0.5">
                              Active Guardian
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-center">
                          <p className="text-sm text-slate-500 dark:text-slate-400">No guardian linked.</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Go to{' '}
                            <span className="font-semibold text-emerald-600">Settings → Linked Accounts</span>{' '}
                            to add one.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guardian: show linked patients */}
                  {isGuardian && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Linked Patients ({linkedPatients.length})
                      </p>
                      {linkLoading ? (
                        <div className="space-y-2">
                          <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
                          <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
                        </div>
                      ) : linkedPatients.length > 0 ? (
                        <div className="space-y-3">
                          {linkedPatients.map(p => (
                            <div key={p.id || p._id} className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {(p.username || p.name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-sm">
                                  {p.username || p.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {p.email}
                                </p>
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                                  Linked Patient
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-center">
                          <p className="text-sm text-slate-500 dark:text-slate-400">No patients linked yet.</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Go to{' '}
                            <span className="font-semibold text-emerald-600">Settings → Linked Accounts</span>{' '}
                            to send a request.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700">
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out from Account
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <AvatarPickerModal
          currentAvatar={currentAvatar}
          onSelect={handleAvatarSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}