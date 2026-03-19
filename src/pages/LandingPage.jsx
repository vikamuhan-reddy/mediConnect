import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Stethoscope, 
  Users, 
  Heart, 
  ArrowRight, 
  ShieldCheck, 
  Video, 
  Clock 
} from 'lucide-react';

export default function LandingPage() {
  const portals = [
    {
      title: "Doctor Portal",
      description: "Manage your practice, view patient records, and conduct video consultations with ease.",
      icon: Stethoscope,
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      features: ["Patient Management", "Video Consultation", "Digital Prescriptions"],
      link: "/signup",
      role: "doctor"
    },
    {
      title: "Patient Portal",
      description: "Access healthcare services, book appointments, and track your medical history.",
      icon: Heart,
      color: "bg-emerald-600",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      features: ["Easy Booking", "Health Reminders", "Secure Records"],
      link: "/signup",
      role: "patient"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl md:text-6xl tracking-tight">
            MediConnect <span className="text-emerald-600">Unified Portal</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
            A comprehensive healthcare ecosystem connecting doctors, patients, and guardians in one secure platform.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/login" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Sign In
            </Link>
            <Link to="/signup" className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Portal Selection */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Choose Your Portal</h2>
          <p className="text-slate-500 mt-2">Select the role that best describes your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {portals.map((portal) => (
            <div key={portal.title} className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-emerald-500 transition-all hover:shadow-xl group">
              <div className={`w-14 h-14 ${portal.lightColor} ${portal.textColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <portal.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{portal.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {portal.description}
              </p>
              <ul className="space-y-3 mb-8">
                {portal.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to={portal.link}
                className={`w-full flex items-center justify-center gap-2 py-4 ${portal.color} text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg`}
              >
                Enter {portal.title}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="flex flex-col items-center text-center p-6">
              <Video className="w-12 h-12 text-emerald-400 mb-4" />
              <h4 className="text-xl font-bold mb-2">Video Consultations</h4>
              <p className="text-slate-400 text-sm">High-quality video calls for remote medical advice.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Clock className="w-12 h-12 text-emerald-400 mb-4" />
              <h4 className="text-xl font-bold mb-2">Smart Reminders</h4>
              <p className="text-slate-400 text-sm">Never miss a dose with automated medicine alerts.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mb-4" />
              <h4 className="text-xl font-bold mb-2">Secure Records</h4>
              <p className="text-slate-400 text-sm">Your medical data is encrypted and protected.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 MediConnect Telemedicine Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
