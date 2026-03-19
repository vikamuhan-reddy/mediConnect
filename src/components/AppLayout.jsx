import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password'];

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);

  if (isPublic || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
        <Navbar />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <div className="flex max-w-screen-2xl mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-64px)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}