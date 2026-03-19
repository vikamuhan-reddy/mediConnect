import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video, PhoneOff, MessageSquare,
  Settings, Shield, Send, X, FileText, Upload,
  CheckCircle2, AlertCircle, Paperclip, Mic, MicOff, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VideoRoom from '../components/VideoRoom';
import { io } from 'socket.io-client';

// ── Prescription Upload (unchanged) ──────────────────────────────────────────
function PrescriptionUpload({ appointmentId, onUploaded }) {
  const [file,      setFile]      = React.useState(null);
  const [notes,     setNotes]     = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [success,   setSuccess]   = React.useState(false);
  const [error,     setError]     = React.useState('');
  const [dragOver,  setDragOver]  = React.useState(false);
  const fileInputRef = React.useRef(null);

  const validateAndSet = (selected) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(selected.type)) { setError('Only PDF, JPG, and PNG files are allowed.'); return; }
    if (selected.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return; }
    setError(''); setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file.');
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('prescription', file);
      formData.append('appointment_id', appointmentId);
      formData.append('notes', notes);
     const res = await api.post('/prescriptions/upload', formData);
      setSuccess(true);
      onUploaded?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (success) return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-3" />
      <p className="text-white font-bold">Prescription Uploaded!</p>
      <button onClick={() => { setSuccess(false); setFile(null); setNotes(''); }}
        className="mt-4 text-xs text-emerald-400 underline">Upload another</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) validateAndSet(f); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'border-emerald-400 bg-emerald-500/10' : file ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40'}`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }} className="hidden" />
        {file ? (
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <p className="text-white text-sm truncate flex-1">{file.name}</p>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-white/40 hover:text-red-400">
              <X className="w-4 h-4" /></button>
          </div>
        ) : (
          <><Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-white/60 text-sm">Drop file here or click to browse</p>
          <p className="text-white/30 text-xs mt-1">PDF, JPG, PNG · Max 5MB</p></>
        )}
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes for patient (optional)" rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500 resize-none" />
      {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
        <AlertCircle className="w-4 h-4" />{error}</div>}
      <button onClick={handleUpload} disabled={!file || uploading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
        {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
          : <><Upload className="w-4 h-4" />Upload Prescription</>}
      </button>
    </div>
  );
}

// ── Jitsi Meeting (unchanged) ─────────────────────────────────────────────────
function JitsiMeeting({ roomName, displayName, onApiReady }) {
  const containerRef = React.useRef(null);
  const apiRef       = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState('');

  React.useEffect(() => {
    const existingScript = document.getElementById('jitsi-api-script');
    const initJitsi = () => {
      if (!containerRef.current) return;
      try {
        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName, parentNode: containerRef.current,
          width: '100%', height: '100%',
          userInfo: { displayName: displayName || 'User' },
          configOverwrite: {
            startWithAudioMuted: false, startWithVideoMuted: false,
            disableDeepLinking: true, enableWelcomePage: false,
            prejoinPageEnabled: false, prejoinConfig: { enabled: false, hideDisplayName: true },
            disablePrejoinPage: true, startAsGuest: true,
            enableUserRolesBasedOnToken: false, toolbarButtons: [],
            requireDisplayName: false, enableInsecureRoomNameWarning: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false,
            FILM_STRIP_MAX_HEIGHT: 0, VERTICAL_FILMSTRIP: false,
            TOOLBAR_BUTTONS: [], SETTINGS_SECTIONS: [],
            SHOW_CHROME_EXTENSION_BANNER: false, DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          },
        });
        const autoJoin = setInterval(() => {
          try {
            const iframe = containerRef.current?.querySelector('iframe');
            if (!iframe) return;
            const btn = iframe.contentDocument?.querySelector('[data-testid="prejoin-join-button"], .prejoin-preview button, button[class*="join"]');
            if (btn) { btn.click(); clearInterval(autoJoin); }
          } catch (_) {}
        }, 500);
        setTimeout(() => clearInterval(autoJoin), 10000);
        apiRef.current.addEventListener('videoConferenceJoined', () => {
          clearInterval(autoJoin); setLoading(false);
          try { apiRef.current.executeCommand('toggleFilmStrip'); } catch (_) {}
        });
        onApiReady?.(apiRef.current);
      } catch (err) {
        setError('Failed to load video call. Please check your internet connection.');
        setLoading(false);
      }
    };
    if (existingScript) {
      if (window.JitsiMeetExternalAPI) initJitsi();
      else existingScript.addEventListener('load', initJitsi);
    } else {
      const script = document.createElement('script');
      script.id = 'jitsi-api-script'; script.src = 'https://meet.jit.si/external_api.js';
      script.async = true; script.onload = initJitsi;
      script.onerror = () => { setError('Could not load Jitsi.'); setLoading(false); };
      document.body.appendChild(script);
    }
    return () => { if (apiRef.current) { try { apiRef.current.dispose(); } catch (_) {} apiRef.current = null; } };
  }, [roomName]);

  if (error) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div className="text-center px-6">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-white font-bold mb-1">Video call unavailable</p>
        <p className="text-white/50 text-sm">{error}</p>
      </div>
    </div>
  );
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-bold">Connecting to video call...</p>
          <p className="text-white/40 text-sm mt-1">Room: {roomName}</p>
        </div>
      )}
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  );
}

// ── useAudioRecorder hook ─────────────────────────────────────────────────────
function useAudioRecorder() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob,   setAudioBlob]   = React.useState(null);
  const mediaRecorderRef = React.useRef(null);
  const chunksRef        = React.useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

const audioTracks = stream.getAudioTracks();
const audioOnlyStream = new MediaStream(audioTracks);

const mediaRecorder = new MediaRecorder(audioOnlyStream, {
  mimeType: 'audio/webm'
});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000); // collect every 1s
      setIsRecording(true);
      console.log('[Recording] Started');
    } catch (err) {
      console.error('[Recording] Failed to start:', err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('[Recording] Stopped');
    }
  };

  return { isRecording, audioBlob, startRecording, stopRecording };
}

// ── Main Consultation ─────────────────────────────────────────────────────────
export default function Consultation() {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activePanel,          setActivePanel]          = React.useState(null);
  const [message,              setMessage]              = React.useState('');
  const [chatMessages,         setChatMessages]         = React.useState([
    { id: 1, sender: 'Dr. Sarah Smith', text: 'Hello! How are you feeling today?',                         time: '10:00 AM' },
    { id: 2, sender: 'You',             text: 'I have been feeling a bit better, but still have a cough.', time: '10:01 AM' },
  ]);
  const [uploadedPrescription, setUploadedPrescription] = React.useState(null);
  const [isMicOn,              setIsMicOn]              = React.useState(true);
  const [isCameraOn,           setIsCameraOn]           = React.useState(true);

  // ── AI Summary states ─────────────────────────────────────────────────────
  const [summaryStatus, setSummaryStatus] = React.useState('idle'); // idle | processing | done | error
  const [summaryError,  setSummaryError]  = React.useState('');
  const [appointment,   setAppointment]   = React.useState(null);

  const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();

  const chatSocketRef = React.useRef(null);
  const chatBottomRef = React.useRef(null);

  const isDoctor    = user?.role === 'doctor';
  const isGuardian  = user?.role === 'guardian';
  const roomName    = `mediconnect-consultation-${appointmentId}`;
  const displayName = user?.name || user?.username || (isDoctor ? 'Doctor' : 'Patient');
  const chatRoom    = `chat-${appointmentId}`;

  // Fetch appointment to get doctorId + patientId
  React.useEffect(() => {
    api.get('/appointments')
      .then(res => {
        const appts = res.data?.appointments || res.data || [];
        const appt  = appts.find(a => (a.id || a._id) === appointmentId);
        if (appt) setAppointment(appt);
      })
      .catch(() => {});
  }, [appointmentId]);

  // Auto-start recording when consultation loads
  React.useEffect(() => {
    const timer = setTimeout(() => {
      startRecording();
    }, 2000); // slight delay to let video connect first
    return () => clearTimeout(timer);
  }, []);

  // ── Socket.IO chat ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
    const socket  = io(BACKEND, { transports: ['websocket'] });
    chatSocketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join-chat', { room: chatRoom, userName: displayName });
    });
    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });
    return () => socket.disconnect();
  }, [chatRoom]);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── End call: stop recording → send to backend → redirect to summary ──────
  const handleEndCall = async () => {
    if (!window.confirm('End this consultation and generate AI summary?')) return;

    stopRecording();
    setSummaryStatus('processing');
  };

  // When audioBlob is ready after stopRecording, upload it
  React.useEffect(() => {
    if (!audioBlob || summaryStatus !== 'processing') return;
    uploadAndSummarize();
  }, [audioBlob, summaryStatus]);

  const uploadAndSummarize = async () => {
    try {
      console.log('[Summary] Uploading audio, size:', audioBlob.size);

      const doctorId  = appointment?.doctor?.id  || appointment?.doctor_id  || user?.id;
      const patientId = appointment?.patient?.id || appointment?.user_id    || user?.id;

      const formData = new FormData();
      formData.append('audio',         audioBlob, 'consultation.webm');
      formData.append('appointmentId', appointmentId);
      formData.append('doctorId',      doctorId);
      formData.append('patientId',     patientId);

      const token = localStorage.getItem("token");

const { data } = await api.post(
  '/consultation/transcribe',
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`
    },
    timeout: 120000
  }
);

      console.log('[Summary] Done, summaryId:', data.summaryId);
      setSummaryStatus('done');
      navigate(`/consultation/summary/${data.summaryId}`);
    } catch (err) {
      console.error('[Summary] Failed:', err.message);
      setSummaryError(err.response?.data?.error || 'Could not generate summary.');
      setSummaryStatus('error');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const msg = {
      id:     Date.now(),
      sender: displayName,
      text:   message,
      time:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    chatSocketRef.current?.emit('send-chat', { room: chatRoom, msg });
    setMessage('');
  };

  const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel);

  // ── Processing overlay ────────────────────────────────────────────────────
  if (summaryStatus === 'processing') return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[70]">
      <div className="text-center max-w-sm px-6">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Generating AI Summary</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Transcribing your consultation audio and creating a structured medical summary...
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  // ── Error overlay ─────────────────────────────────────────────────────────
  if (summaryStatus === 'error') return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[70]">
      <div className="text-center max-w-sm px-6">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Summary Failed</h2>
        <p className="text-white/50 text-sm mb-6">{summaryError}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20">
            Go to Dashboard
          </button>
          <button onClick={() => { setSummaryStatus('idle'); }}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-[60]">

      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">
              {isDoctor ? 'Patient Consultation' : isGuardian ? 'Consultation (Guardian View)' : 'Video Consultation'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Live</span>
              {isRecording && (
                <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  REC
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            <VideoRoom
              roomId={roomName}
              userName={displayName}
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
            />
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-white/10">
            <div className="w-40">
              {uploadedPrescription && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 text-[10px] font-bold">Rx Sent</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Mic */}
              <button onClick={() => setIsMicOn(p => !p)}
                className={`p-4 rounded-2xl transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
                {isMicOn
                  ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                }
              </button>

              {/* Camera */}
              <button onClick={() => setIsCameraOn(p => !p)}
                className={`p-4 rounded-2xl transition-all ${isCameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
                {isCameraOn
                  ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2zM3 3l18 18" /></svg>
                }
              </button>

              {/* End Call → triggers AI summary */}
              <button onClick={handleEndCall}
                className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                title="End Call & Generate Summary">
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Chat */}
              <button onClick={() => togglePanel('chat')}
                className={`p-4 rounded-2xl transition-all ${activePanel === 'chat' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <MessageSquare className="w-6 h-6" />
              </button>

              {/* Prescription (doctor only) */}
              {isDoctor && (
                <button onClick={() => togglePanel('prescription')}
                  className={`p-4 rounded-2xl transition-all relative ${activePanel === 'prescription' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <Paperclip className="w-6 h-6" />
                  {uploadedPrescription && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
                  )}
                </button>
              )}

              {isGuardian && (
                <div className="px-3 py-2 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-300 text-xs font-bold">
                  Guardian View
                </div>
              )}
            </div>

            <div className="w-40" />
          </div>
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              key={activePanel}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 bg-slate-900 border-l border-white/10 flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  {activePanel === 'chat'
                    ? <><MessageSquare className="w-4 h-4 text-emerald-400" /><h3 className="text-white font-bold">Consultation Chat</h3></>
                    : <><FileText className="w-4 h-4 text-blue-400" /><h3 className="text-white font-bold">Upload Prescription</h3></>
                  }
                </div>
                <button onClick={() => setActivePanel(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activePanel === 'chat' ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender === displayName ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                          msg.sender === displayName    ? 'bg-emerald-600 text-white rounded-tr-none'
                          : msg.sender === 'System' ? 'bg-blue-500/20 text-blue-300 text-xs italic w-full text-center rounded-xl'
                          : 'bg-white/10 text-white rounded-tl-none'
                        }`}>
                          {msg.sender !== 'System' && <p className="font-bold text-[10px] mb-1 opacity-60">{msg.sender}</p>}
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-white/30 mt-1">{msg.time}</span>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex-shrink-0">
                    <div className="relative">
                      <input type="text" placeholder="Type a message..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-emerald-500"
                        value={message} onChange={(e) => setMessage(e.target.value)} />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:text-emerald-400">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-white/40 text-xs mb-4 leading-relaxed">
                    Upload a prescription file. The patient can view and download it immediately.
                  </p>
                  <PrescriptionUpload
                    appointmentId={appointmentId}
                    onUploaded={(data) => {
                      setUploadedPrescription(data);
                      setChatMessages(prev => [...prev, {
                        id: Date.now(), sender: 'System',
                        text: '📎 Prescription uploaded successfully.',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      }]);
                    }}
                  />
                  {uploadedPrescription && (
                    <div className="mt-6 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{uploadedPrescription.filename || 'prescription'}</p>
                        <p className="text-white/40 text-xs">Sent to patient</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}