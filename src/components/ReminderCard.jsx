import React from 'react';
import { Pill, CheckCircle2, Circle } from 'lucide-react';

export default function ReminderCard({ reminder, onToggle }) {
  const isTaken = reminder.status === 'taken';

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
      isTaken ? 'bg-emerald-50 border-emerald-100 opacity-75' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isTaken ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'
        }`}>
          <Pill className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`font-bold ${isTaken ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
            {reminder.medicine}
          </h4>
          <p className="text-xs text-slate-500">{reminder.dosage} • {reminder.time}</p>
        </div>
      </div>
      
      <button 
        onClick={() => onToggle(reminder.id)}
        className={`p-2 rounded-full transition-colors ${
          isTaken ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-500'
        }`}
      >
        {isTaken ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
      </button>
    </div>
  );
}
