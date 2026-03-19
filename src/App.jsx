import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import DoctorSearch from './pages/DoctorSearch';
import DoctorProfile from './pages/DoctorProfile';
import AppointmentBooking from './pages/AppointmentBooking';
import Consultation from './pages/Consultation';
import ConsultationSummaryPage from './pages/ConsultationSummaryPage';
import PrescriptionViewer from './pages/PrescriptionViewer';
import MedicineReminders from './pages/MedicineReminders';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import { Toaster } from 'react-hot-toast';

const FULL_SCREEN_PATHS = ['/consultation'];

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/'].includes(location.pathname);
  const isFullScreen = FULL_SCREEN_PATHS.some(p => location.pathname.startsWith(p));

  if (isAuthPage || isFullScreen) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/"                element={<LandingPage />} />
              <Route path="/login"           element={<Login />} />
              <Route path="/signup"          element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/doctors"   element={<ProtectedRoute><DoctorSearch /></ProtectedRoute>} />
              <Route path="/doctor/:id" element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>} />
              <Route path="/book/:id"  element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />

              {/* Consultation — full screen, no navbar */}
              <Route path="/consultation/:id" element={<ProtectedRoute><Consultation /></ProtectedRoute>} />

              {/* ✅ Summary page — has navbar/sidebar */}
              <Route path="/consultation/summary/:id" element={<ProtectedRoute><ConsultationSummaryPage /></ProtectedRoute>} />

              <Route path="/prescriptions"              element={<ProtectedRoute><PrescriptionViewer /></ProtectedRoute>} />
              <Route path="/prescriptions/:appointmentId" element={<ProtectedRoute><PrescriptionViewer /></ProtectedRoute>} />
              <Route path="/reminders"                  element={<ProtectedRoute><MedicineReminders /></ProtectedRoute>} />
              <Route path="/notifications"              element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile"                    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings"                   element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}