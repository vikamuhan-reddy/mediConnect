import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export default function VideoCall({ doctorName, onEnd }) {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden relative">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Doctor Video (Main) */}
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
          <img 
            src="https://picsum.photos/seed/doc/800/600" 
            alt="Doctor"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <p className="text-white font-medium text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {doctorName}
            </p>
          </div>
        </div>

        {/* Patient Video (PIP) */}
        <motion.div 
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="absolute top-6 right-6 w-48 h-32 bg-slate-700 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden cursor-move z-10"
        >
          {!isVideoOff ? (
            <img 
              src="https://picsum.photos/seed/patient/200/150" 
              alt="You"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <VideoOff className="w-8 h-8 text-slate-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/40 px-2 py-0.5 rounded text-[10px] text-white">You</div>
        </motion.div>

        {/* Connection Status */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
            <div className="w-1 h-3 bg-slate-500 rounded-full"></div>
          </div>
          <span className="text-white text-xs font-medium">Stable Connection</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors">
            <Settings className="w-6 h-6" />
          </button>
          <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors">
            <Users className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={onEnd}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-lg shadow-red-900/20"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3 rounded-2xl transition-all ${isChatOpen ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Chat Panel Overlay (Simple) */}
      {isChatOpen && (
        <motion.div 
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-white z-20 shadow-2xl flex flex-col"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Chat</h3>
            <button onClick={() => setIsChatOpen(false)}><XIcon className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 max-w-[80%]">
              Hello! How can I help you today?
            </div>
          </div>
          <div className="p-4 border-t border-slate-100">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function XIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
