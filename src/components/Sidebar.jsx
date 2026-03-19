import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Calendar, Clock,
  FileText, Bell, User, Video, Settings, Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard',     roles: ['patient', 'doctor', 'guardian'] },
  { icon: Search,          label: 'Find Doctors',  path: '/doctors',       roles: ['patient', 'guardian'] },
  { icon: Calendar,        label: 'Appointments',  path: '/dashboard',     roles: ['patient', 'doctor', 'guardian'] },
  { icon: Clock,           label: 'Reminders',     path: '/reminders',     roles: ['patient', 'guardian'] },
  { icon: FileText,        label: 'Prescriptions', path: '/prescriptions', roles: ['patient', 'doctor', 'guardian'] },
  { icon: Bell,            label: 'Notifications', path: '/notifications', roles: ['patient', 'doctor', 'guardian'] },
  { icon: User,            label: 'Profile',       path: '/profile',       roles: ['patient', 'doctor', 'guardian'] },
  { icon: Settings,        label: 'Settings',      path: '/settings',      roles: ['patient', 'doctor', 'guardian'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isDoctor  = user?.role === 'doctor';
  const filteredItems = navItems.filter(item => item.roles.includes(user?.role || 'patient'));

  const handleViewSchedule = () => {
    const el = document.getElementById('doctor-schedule');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/dashboard');
      setTimeout(() => {
        document.getElementById('doctor-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 h-[calc(100vh-64px)] sticky top-16 transition-colors duration-300">
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700/60">
        {isDoctor ? (
          <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-4 text-white border dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold text-sm">My Patients</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              View appointments and manage your patient schedule.
            </p>
            <button
              onClick={handleViewSchedule}
              className="w-full py-2 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              View Schedule
            </button>
          </div>
        ) : (
          <div className="bg-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5" />
              <span className="font-semibold text-sm">Telehealth</span>
            </div>
            <p className="text-xs text-emerald-100 mb-3">
              Connect with your doctor instantly via video call.
            </p>
            <NavLink
              to="/doctors"
              className="block w-full py-2 text-center bg-white text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors"
            >
              Start Consultation
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}