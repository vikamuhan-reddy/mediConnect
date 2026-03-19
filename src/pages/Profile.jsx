import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Mail, Phone, LogOut, Camera,
  Shield, Check, X, Edit2, MapPin, Upload, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Avatar sets from DiceBear (free, no-auth SVG avatars) ────────────────────
const AVATAR_STYLES = [
  { label: 'Avatars',    style: 'avataaars'      },
  { label: 'Pixel Art',  style: 'pixel-art'      },
  { label: 'Lorelei',    style: 'lorelei'        },
  { label: 'Notionists', style: 'notionists'     },
  { label: 'Adventurer', style: 'adventurer'     },
];

// 12 preset seeds per style
const SEEDS = [
  'Felix','Loki','Midnight','Zara','Nova','Atlas',
  'Luna','Orion','Sage','River','Echo','Storm',
];

function avatarUrl(style, seed) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ── Avatar Picker Modal ───────────────────────────────────────────────────────
function AvatarPickerModal({ currentAvatar, userName, onSelect, onClose }) {
  const [activeStyle, setActiveStyle] = React.useState(AVATAR_STYLES[0]);
  const [selected,    setSelected]    = React.useState(currentAvatar || '');
  const [uploadPreview, setUploadPreview] = React.useState(null);
  const fileRef = React.useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview(ev.target.result);
      setSelected(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (selected) onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Choose Your Avatar</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Style Tabs */}
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto pb-1">
          {AVATAR_STYLES.map(s => (
            <button
              key={s.style}
              onClick={() => { setActiveStyle(s); setUploadPreview(null); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeStyle.style === s.style
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            {SEEDS.map(seed => {
              const url = avatarUrl(activeStyle.style, seed);
              const isActive = selected === url;
              return (
                <button
                  key={seed}
                  onClick={() => { setSelected(url); setUploadPreview(null); }}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    isActive
                      ? 'border-emerald-500 shadow-lg shadow-emerald-200 scale-105'
                      : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <img
                    src={url}
                    alt={seed}
                    className="w-full h-full object-cover bg-slate-50"
                    loading="lazy"
                  />
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

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 py-2">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400 font-semibold">OR</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Upload custom */}
        <div className="px-6 pb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload your own photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadPreview && (
            <div className="flex items-center gap-3 mt-3 p-3 bg-emerald-50 rounded-2xl">
              <img src={uploadPreview} alt="preview" className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-200" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-700">Custom photo selected</p>
                <p className="text-xs text-emerald-600">This will be your profile picture</p>
              </div>
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [isEditing,    setIsEditing]    = React.useState(false);
  const [showPicker,   setShowPicker]   = React.useState(false);
  const [formData,     setFormData]     = React.useState({ name: '', email: '', phone: '' });
  const [loading,      setLoading]      = React.useState(false);
  const [message,      setMessage]      = React.useState({ type: '', text: '' });

  // Avatar: stored in user object or fallback to dicebear from name
  const currentAvatar = user?.avatar || avatarUrl('avataaars', user?.name || 'user');

  React.useEffect(() => {
    if (user) {
      setFormData({
        name:  user.name  || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/profile', { username: formData.name, phone: formData.phone });
      updateUser({ ...user, name: formData.name, phone: formData.phone, ...res.data });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl) => {
    // Save avatar into user object in localStorage via updateUser
    updateUser({ ...user, avatar: avatarUrl });
    setMessage({ type: 'success', text: 'Avatar updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2500);
  };

  if (!user) return null;

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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xl shadow-slate-200/50">

          {/* Top row: avatar + name + edit button */}
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center">

              {/* Avatar with camera button */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-emerald-100 border-4 border-white shadow-lg overflow-hidden">
                  {currentAvatar.startsWith('data:') ? (
                    // uploaded custom photo
                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    // dicebear SVG url
                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover bg-slate-50" />
                  )}
                </div>
                {/* Camera button — always visible, opens picker */}
                <button
                  onClick={() => setShowPicker(true)}
                  className="absolute bottom-2 right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
                {/* Hover overlay */}
                <div
                  onClick={() => setShowPicker(true)}
                  className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-slate-900">{user.name || user.username}</h1>
                <p className="text-emerald-600 font-bold text-sm capitalize">{user.role}</p>
                <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit / Save / Cancel */}
            <div className="flex gap-3 w-full md:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Success / error message */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Change avatar prompt text */}
          <p
            onClick={() => setShowPicker(true)}
            className="mt-4 text-xs text-slate-400 cursor-pointer hover:text-emerald-600 transition-colors text-center md:text-left"
          >
            Click the camera icon or <span className="font-semibold underline">choose from avatars</span> to update your profile picture
          </p>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-600" /> Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{user.name || user.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <p className="text-slate-900 font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" /> Account Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-900">Role</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role} account</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg capitalize">{user.role}</span>
                </div>

                {/* Quick avatar preview strip */}
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="font-bold text-slate-900 mb-3 text-sm">Quick Avatar Change</p>
                  <div className="flex gap-2 flex-wrap">
                    {SEEDS.slice(0, 6).map(seed => {
                      const url = avatarUrl('avataaars', seed);
                      const isActive = currentAvatar === url;
                      return (
                        <button
                          key={seed}
                          onClick={() => handleAvatarSelect(url)}
                          title={seed}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${
                            isActive ? 'border-emerald-500 scale-110' : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img src={url} alt={seed} className="w-full h-full object-cover bg-slate-100" />
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowPicker(true)}
                      className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                      title="See all avatars"
                    >
                      <span className="text-slate-400 text-lg leading-none">+</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out from Account
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showPicker && (
        <AvatarPickerModal
          currentAvatar={currentAvatar}
          userName={user.name || user.username}
          onSelect={handleAvatarSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}