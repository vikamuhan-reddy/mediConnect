import React from 'react';
import { Activity } from 'lucide-react';

const Loader = ({ fullScreen, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Activity className={`${sizeClasses[size]} text-emerald-600 animate-pulse`} />
        <div className={`absolute inset-0 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin ${sizeClasses[size]}`}></div>
      </div>
      {fullScreen && <p className="text-slate-500 font-medium animate-pulse">Loading MediConnect...</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
