import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ChevronLeft, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Mock API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100"
        >
          {!submitted ? (
            <>
              <div className="mb-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Forgot Password?</h1>
                <p className="text-slate-500 leading-relaxed">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Check your email</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                We've sent a password reset link to <span className="font-bold text-slate-900">{email}</span>. Please check your inbox and follow the instructions.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => setSubmitted(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Resend Email
                </button>
                <Link 
                  to="/login"
                  className="block w-full py-4 text-slate-500 font-bold hover:text-slate-900 transition-all"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-center text-slate-400 text-sm mt-12">
          Remember your password? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
