import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Menu, X, Activity, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen,  setIsMenuOpen]  = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setUnreadCount(data.filter(n => !n.read).length);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/doctors?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const isLandingPage = location.pathname === '/';

  if (!user) {
    if (isLandingPage) {
      return (
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
                <Activity className="w-8 h-8" />
                <span>MediConnect</span>
              </Link>
              <div className="flex gap-4">
                <Link to="/login"  className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors">Sign In</Link>
                <Link to="/signup" className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">Get Started</Link>
              </div>
            </div>
          </div>
        </nav>
      );
    }
    return null;
  }

  return (
    <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
              <Activity className="w-8 h-8" />
              <span className="hidden sm:block">MediConnect</span>
            </Link>
            <form onSubmit={handleSearch} className="hidden lg:flex items-center relative group">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/notifications" className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name || user.username}</p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{user.role}</p>
              </div>
              <Link to="/profile" className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-sm overflow-hidden">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </Link>
              <button onClick={handleLogout} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-500 dark:text-slate-400">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600">Dashboard</Link>
          <Link to="/doctors"   className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600">Find Doctors</Link>
          <Link to="/reminders" className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600">Reminders</Link>
          <Link to="/profile"   className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600">Profile</Link>
          <Link to="/settings"  className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600">Settings</Link>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}