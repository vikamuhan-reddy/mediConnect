import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Mail, Lock, User, Phone, ArrowRight,
  AlertCircle, CheckCircle2, Stethoscope, Building2,
  Clock, DollarSign, ChevronDown
} from 'lucide-react';
import { register } from '../services/auth';

const SPECIALIZATIONS = [
  'Cardiologist','Dermatologist','Pediatrician','Neurologist',
  'Orthopedic','Nephrologist','Endocrinologist','Psychiatrist',
  'Ophthalmologist','Pulmonologist','Gastroenterologist','Oncologist',
  'Gynecologist','ENT Specialist','Urologist','Rheumatologist',
  'General Physician',
];

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword:'',
    role: 'patient',

    specialization: '',
    hospital: '',
    experience: '',
    fee: '',
  });

  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const passwordStrength = (pass) => {
    if (!pass.length) return 0;
    let s = 0;
    if (pass.length > 6) s += 25;
    if (/[A-Z]/.test(pass)) s += 25;
    if (/[0-9]/.test(pass)) s += 25;
    if (/[^A-Za-z0-9]/.test(pass)) s += 25;
    return s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match');

    if (formData.role === 'doctor') {
      if (!formData.specialization) return setError('Please select a specialization.');
      if (!formData.hospital) return setError('Please enter your hospital/clinic name.');
    }

    setLoading(true);
    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(formData.password);
  const isDoctor = formData.role === 'doctor';

  const inputCls = 'appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Activity className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create your account
        </h2>

        <p className="mt-2 text-center text-sm text-slate-600">
          Join MediConnect to manage healthcare efficiently
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">

          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Registration Successful!</h3>
              <p className="text-slate-600 mt-2">Redirecting you to login...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Role selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                {['patient', 'doctor'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('role', r)}
                    className={`py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                      formData.role === r
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Doctor banner */}
              {isDoctor && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs font-medium">
                  <Stethoscope className="w-4 h-4" />
                  Fill in your professional details so patients can find you.
                </div>
              )}

              {/* Name */}
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  className={inputCls}
                  placeholder="Full Name"
                  value={formData.username}
                  onChange={e => set('username', e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  className={inputCls}
                  placeholder="Email"
                  value={formData.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>

              {/* Doctor fields */}
              {isDoctor && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <select
                    required
                    className={inputCls}
                    value={formData.specialization}
                    onChange={e => set('specialization', e.target.value)}
                  >
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>

                  <input
                    type="text"
                    required
                    className={inputCls}
                    placeholder="Hospital"
                    value={formData.hospital}
                    onChange={e => set('hospital', e.target.value)}
                  />
                </div>
              )}

              {/* Phone */}
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  required
                  className={inputCls}
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  className={inputCls}
                  placeholder="Password"
                  value={formData.password}
                  onChange={e => set('password', e.target.value)}
                />
              </div>

              {/* Strength bar */}
              {formData.password && (
                <div className="h-1 bg-slate-100 rounded">
                  <div className={`h-full ${strength > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${strength}%` }} />
                </div>
              )}

              {/* Confirm */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  className={inputCls}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex justify-center items-center gap-2"
              >
                {loading ? 'Creating...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-slate-600">
              Already have an account?
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}