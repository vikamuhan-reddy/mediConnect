import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Award,
  Globe,
  Clock,
  Calendar,
  ChevronLeft,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

export default function DoctorProfile() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [doctor,  setDoctor]  = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState('');

  React.useEffect(() => {
    const fetchDoctor = async () => {
      try {
        // ✅ fixed — was GET /doctors then .find(), now fetches single doctor directly
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data.doctor || res.data);
      } catch (err) {
        console.error('Failed to fetch doctor', err);
        setError('Could not load doctor profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

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
    <div className="max-w-4xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to search
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Profile Info */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">

              {/* ✅ fixed — photo fallback if doctor.photo is empty */}
              {doctor.photo ? (
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-emerald-50 shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-emerald-50 border-4 border-emerald-100 shadow-lg flex items-center justify-center text-emerald-600 text-5xl font-bold">
                  {doctor.name?.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{doctor.name}</h1>
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-emerald-600 font-bold mb-4">{doctor.specialization}</p>

                {doctor.hospital && (
                  <p className="text-sm text-slate-500 mb-4">{doctor.hospital}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {doctor.rating > 0 && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {doctor.rating} Rating
                    </div>
                  )}
                  {doctor.experience > 0 && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Award className="w-4 h-4 text-emerald-600" />
                      {doctor.experience} Years Exp.
                    </div>
                  )}
                  {doctor.language && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Globe className="w-4 h-4 text-blue-600" />
                      {doctor.language}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">About Doctor</h3>
              <p className="text-slate-600 leading-relaxed">
                {doctor.bio
                  ? doctor.bio
                  : `Dr. ${doctor.name?.split(' ').pop()} is highly skilled in ${doctor.specialization?.toLowerCase()} and has been serving patients for over ${doctor.experience} years.`
                }
              </p>
            </div>

            {/* Education */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Education & Training</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                  <div>
                    <p className="font-bold text-slate-900">Medical Degree (MD)</p>
                    <p className="text-sm text-slate-500">Harvard Medical School, 2008</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                  <div>
                    <p className="font-bold text-slate-900">Residency in {doctor.specialization}</p>
                    <p className="text-sm text-slate-500">Johns Hopkins Hospital, 2012</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Patient Reviews</h3>
              <button className="text-sm font-bold text-emerald-600 hover:underline">Write a review</button>
            </div>
            <div className="space-y-6">
              {[
                { initials: 'JD', name: 'John Doe',  text: 'Excellent doctor! Very patient and explained everything clearly. Highly recommend.' },
                { initials: 'SM', name: 'Sarah M.',  text: 'Very knowledgeable and caring. Made me feel comfortable throughout the consultation.' }
              ].map((review, i) => (
                <div key={i} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {review.initials}
                      </div>
                      <span className="font-bold text-slate-900">{review.name}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sticky top-24 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Book Appointment</h3>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Consultation Fee
                </span>
                {/* ✅ fixed — shows real fee from DB, fallback to N/A */}
                <span className="font-bold text-slate-900">
                  {doctor.fee > 0 ? `$${doctor.fee}.00` : 'Contact clinic'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Availability
                </span>
                <span className="font-bold text-emerald-600">{doctor.availability || 'Mon-Fri'}</span>
              </div>
            </div>

            {/* ✅ fixed — uses doctor.id || doctor._id (normalizer gives us id) */}
            <Link
              to={`/book/${doctor.id || doctor._id}`}
              className="w-full block text-center py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 mb-4"
            >
              Book Appointment
            </Link>

            <button className="w-full flex items-center justify-center gap-2 py-4 border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              <MessageSquare className="w-5 h-5" />
              Send Message
            </button>

            <p className="text-[10px] text-center text-slate-400 mt-6 uppercase tracking-widest font-bold">
              Secure & Encrypted Consultation
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}