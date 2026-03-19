import React from 'react';
import { Star, Clock, Globe, Award, Building2, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorCard({ doctor }) {
  // Support both real doctors (MongoDB _id) and dummy doctors (numeric id)
  const doctorId = doctor.id || doctor._id;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">

      {/* Photo / Avatar area */}
      <div className="relative h-48 overflow-hidden bg-emerald-50 dark:bg-emerald-900/20">
        {doctor.photo ? (
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-4 border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 text-4xl font-bold">
              {doctor.name?.charAt(0)?.toUpperCase()}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{doctor.specialization}</p>
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-emerald-600 shadow-sm">
          <Star className="w-4 h-4 fill-emerald-600" />
          {doctor.rating > 0 ? doctor.rating : 'New'}
        </div>

        {/* Real doctor badge */}
        {doctor.isReal && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold shadow-sm">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            {doctor.name}
          </h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{doctor.specialization}</p>
        </div>

        <div className="space-y-2 mb-6">
          {doctor.hospital && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{doctor.hospital}</span>
            </div>
          )}
          {doctor.experience > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Award className="w-4 h-4 flex-shrink-0" />
              <span>{doctor.experience} Years Experience</span>
            </div>
          )}
          {doctor.language && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span>{doctor.language}</span>
            </div>
          )}
          {doctor.availability && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{doctor.availability}</span>
            </div>
          )}
          {doctor.fee > 0 && (
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              ₹{doctor.fee} <span className="font-normal text-slate-400">per consultation</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            to={`/doctor/${doctorId}`}
            className="flex-1 py-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            View Profile
          </Link>
          <Link
            to={`/book/${doctorId}`}
            className="flex-1 py-2 text-center text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}