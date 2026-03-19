import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ onSearch, placeholder = "Search doctors, specializations..." }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
      />
      <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors">
        <SlidersHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}
