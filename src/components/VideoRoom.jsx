import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VideoRoom({ roomId, userName, isMicOn, isCameraOn, onStreamReady, appointmentId, doctorId, patientId, recordingRef }) {
  const localVideoRef  = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const socketRef      = React.useRef(null);
  const pcRef          = React.useRef(null);
  const localStreamRef    = React.useRef(null);
  const mediaRecorderRef  = React.useRef(null);
  const audioChunksRef    = React.useRef([]);
  const navigate          = useNavigate();

  // ── Recording functions ──────────────────────────────────────────────────────
  const startRecording = (stream) => {
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current   = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.start();
    } catch (err) {
      console.warn('[Recording] MediaRecorder not available:', err.message);
    }
  };

  const stopAndUpload = () => new Promise((resolve) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      resolve(null); return;
    }
    mediaRecorderRef.current.onstop = async () => {
      const blob     = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob);
      if (appointmentId) formData.append('appointmentId', appointmentId);
      if (doctorId)      formData.append('doctorId',      doctorId);
      if (patientId)     formData.append('patientId',     patientId);
      try {
        const res = await api.post('/consultation/transcribe', formData);
        resolve(res.data?.summaryId || null);
      } catch (err) {
        console.error('[Recording] Upload failed:', err);
        resolve(null);
      }
    };
    mediaRecorderRef.current.stop();
  });

  const handleEndCall = async () => {
    if (window.confirm('Are you sure you want to end this consultation?')) {
      await recordingRef.current?.handleEndCall();
    }
  };

  // Expose handleEndCall to parent via recordingRef
  React.useEffect(() => {
    if (recordingRef) recordingRef.current = { handleEndCall };
  });

const [status, setStatus] = React.useState('Connecting...');
  const [remoteConnected, setRemoteConnected] = React.useState(false);
    const [permissionState, setPermissionState] = React.useState('ask');

  // Check if permission already granted (e.g. after reload)
  React.useEffect(() => {
    navigator.permissions?.query({ name: 'camera' }).then(result => {
      if (result.state === 'granted') setPermissionState('granted');
    }).catch(() => {});
  }, []);

  // Sync mic/camera toggles from parent buttons
  React.useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMicOn; });
  }, [isMicOn]);

  React.useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isCameraOn; });
  }, [isCameraOn]);

  React.useEffect(() => {
    if (permissionState !== 'granted') return; // don't auto-start until user taps Allow

    let cancelled = false;

    const start = async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setPermissionState('granted');
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionState('denied');
        } else {
          setPermissionState('denied');
        }
        setStatus('Camera/mic access denied.');
        return;
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      onStreamReady?.(stream);
      startRecording(stream);

      // 2. Connect socket
      const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
      const socket = io(BACKEND, { transports: ['websocket'] });
      socketRef.current = socket;

      const createPC = (targetSocketId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
          setRemoteConnected(true);
          setStatus('Connected');
        };

        pc.onicecandidate = (e) => {
          if (e.candidate && targetSocketId) {
            socket.emit('ice-candidate', { to: targetSocketId, candidate: e.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setRemoteConnected(false);
            setStatus('Other participant left');
          }
        };

        return pc;
      };

      socket.on('connect', () => {
        setStatus('Waiting for other participant...');
        socket.emit('join-room', { roomId, userName });
      });

      // I joined and others are already here — I initiate the offer
      socket.on('room-users', async (users) => {
        if (users.length === 0) return; // I'm first, wait
        const target = users[0]; // For 1-on-1, connect to first user
        const pc = createPC(target.socketId);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: target.socketId, offer });
        setStatus('Calling...');
      });

      // Someone new joined — they will send me an offer
      socket.on('user-joined', ({ socketId, userName: name }) => {
        setStatus(`${name} is joining...`);
      });

      socket.on('offer', async ({ from, offer }) => {
        const pc = createPC(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      });

      socket.on('answer', async ({ answer }) => {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (pcRef.current && candidate) {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
        }
      });

      socket.on('user-left', () => {
        setRemoteConnected(false);
        setStatus('Other participant left the call');
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });
    };

    start();

    return () => {
      cancelled = true;
      socketRef.current?.emit('leave-room', { roomId });
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
 }, [roomId, permissionState]);

  const requestPermission = async () => {
    setPermissionState('pending');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Permission granted — stop this test stream, real one starts in useEffect
      stream.getTracks().forEach(t => t.stop());
      setPermissionState('granted');
      // Reload to restart the useEffect cleanly with permission now granted
      window.location.reload();
    } catch (err) {
      setPermissionState('denied');
    }
  };

  // Ask screen — shown first before anything starts
  if (permissionState === 'ask') return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center px-8 max-w-sm">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-white font-bold text-xl mb-3">Ready to join?</p>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Tap the button below. Your browser will ask you to allow camera and microphone — tap <span className="text-emerald-400 font-bold">Allow</span> to join the consultation.
        </p>
        <button
          onClick={requestPermission}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
          </svg>
          Allow Camera & Microphone
        </button>
      </div>
    </div>
  );

  // Waiting for browser prompt
  if (permissionState === 'pending') return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center px-8 max-w-sm">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <p className="text-white font-bold text-lg mb-2">Waiting for permission...</p>
        <p className="text-white/50 text-sm">
          Tap <span className="text-emerald-400 font-bold">Allow</span> on the browser prompt to continue.
        </p>
      </div>
    </div>
  );

  // Permission denied screen
  if (permissionState === 'denied') return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center px-8 max-w-sm">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-white font-bold text-lg mb-2">Permission Blocked</p>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Camera and microphone were blocked. To fix this, tap the lock icon in your browser address bar, allow Camera and Microphone, then try again.
        </p>
        <button
          onClick={requestPermission}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0f172a' }}>

      {/* Remote video — full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: remoteConnected ? 'block' : 'none' }}
      />

      {/* Waiting screen when no remote */}
      {!remoteConnected && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-bold">{status}</p>
          <p className="text-white/40 text-sm mt-1">Room: {roomId}</p>
        </div>
      )}

      {/* Local video — PiP bottom right */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 160, height: 120,
          objectFit: 'cover',
          borderRadius: 12,
          border: '2px solid rgba(255,255,255,0.2)',
          background: '#1e293b',
          zIndex: 10,
        }}
      />
    </div>
  );
}
