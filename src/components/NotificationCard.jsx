import React from 'react';
import { Bell, Calendar, Pill, AlertCircle, X } from 'lucide-react';

export default function NotificationCard({ notification, onDelete }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'reminder': return <Pill className="w-5 h-5 text-emerald-600" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getBg = () => {
    switch (notification.type) {
      case 'appointment': return 'bg-blue-50';
      case 'reminder': return 'bg-emerald-50';
      default: return 'bg-amber-50';
    }
  };

  return (
    <div className={`relative p-4 rounded-2xl border border-slate-200 transition-all hover:border-emerald-200 group ${!notification.read ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
      {!notification.read && (
        <div className="absolute top-4 right-10 w-2 h-2 bg-emerald-500 rounded-full"></div>
      )}
      
      <button 
        onClick={() => onDelete(notification.id)}
        className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getBg()}`}>
          {getIcon()}
        </div>
        <div className="pr-8">
          <h4 className="font-bold text-slate-900 text-sm mb-1">{notification.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">{notification.message}</p>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {new Date(notification.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
