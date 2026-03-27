import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp, SCREENS } from '../../context/AppContext.jsx';
import { useCamera } from '../../hooks/useCamera.js';
import { useSession } from '../../hooks/useSession.js';
import { useRingLight } from '../../hooks/useRingLight.js';
import { Recorder } from '../../lib/recorder.js';
import { normSpeedToReal, classifySpeed } from '../../lib/speedCalculator.js';
import RingLightControls from '../RingLight/RingLightControls.jsx';

export default function SessionScreen() {
  const { state, dispatch } = useApp();
  const { theme, session, ringLight } = state;

  const canvasRef = useRef(null);    // main composited canvas
  const ringCanvasRef = useRef(null); // ring light overlay
  const recorderRef = useRef(new Recorder());
  const previewRafRef = useRef(null);

  const { videoRef, stream, isReady, startCamera, flipCamera, facingMode } = useCamera();
  const { startSession, endSession, isDetectorsReady } = useSession();
  useRingLight(ringCanvasRef);

  const [isRecording, setIsRecording] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [autoCapture, setAutoCapture] = useState(false);
  const [started, setStarted] = useState(false);

  // Inject videoRef into camera hook
  useEffect(() => {
    startCamera('environment');
  }, []);

  // Live camera preview on canvas before session starts
  useEffect(() => {
    if (!isReady || started) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const drawPreview = () => {
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth || 640;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      previewRafRef.current = requestAnimationFrame(drawPreview);
    };

    previewRafRef.current = requestAnimationFrame(drawPreview);
    return () => cancelAnimationFrame(previewRafRef.current);
  }, [isReady, started, videoRef]);

  // Auto-capture on bubble pop
  useEffect(() => {
    if (!autoCapture) return;
    const handle = () => capturePhoto();
    window.addEventListener('bubble-pop', handle);
    return () => window.removeEventListener('bubble-pop', handle);
  }, [autoCapture]);

  const canStart = isReady && isDetectorsReady;

  const handleStart = useCallback(async () => {
    if (!canStart || started) return;
    cancelAnimationFrame(previewRafRef.current);
    setStarted(true);
    await startSession(videoRef.current, canvasRef.current);
  }, [canStart, started, startSession]);

  const handleEnd = useCallback(() => {
    endSession();
  }, [endSession]);

  const toggleRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!isRecording) {
      recorder.start(canvasRef.current, 30);
      setIsRecording(true);
    } else {
      const blob = await recorder.stop();
      if (blob) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        recorder.saveToDevice(blob, `bubbleboxing-${ts}.webm`);
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    recorderRef.current.capturePhoto(canvas, `bubbleboxing-photo-${ts}.jpg`);
    setPhotoCount((n) => n + 1);
  }, []);

  // Format time as MM:SS
  const timeLeft = session.timeLeft ?? 180;
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const timerColor = timeLeft <= 30 ? '#ff4466' : theme.accent;

  // Speed display
  const speedDisplay = (() => {
    if (!session.lastPunchRating) return null;
    if (session.pixelsPerCm && canvasRef.current) {
      const real = normSpeedToReal(
        session.lastPunchSpeed,
        session.pixelsPerCm,
        canvasRef.current.width
      );
      if (real) return `${real.kmh} km/h`;
    }
    return session.lastPunchRating;
  })();

  return (
    <div style={styles.container}>
      {/* Hidden video element — camera streams here */}
      <video ref={videoRef} style={styles.hiddenVideo} playsInline muted />

      {/* Main canvas fills screen */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Ring light canvas on top */}
      <canvas ref={ringCanvasRef} style={styles.ringCanvas} />

      {/* --- Overlays --- */}

      {/* Recording indicator */}
      {isRecording && (
        <div style={styles.recIndicator}>
          <span style={styles.recDot} />
          REC
        </div>
      )}

      {/* Bubble pop counter */}
      <div style={styles.popCounter(theme)}>
        <span style={styles.popNum(theme)}>{session.popCount}</span>
        <span style={styles.popLabel}>pops</span>
      </div>

      {/* Speed indicator */}
      {speedDisplay && (
        <div style={styles.speedBadge(theme)}>
          <span style={styles.speedIcon}>⚡</span>
          <span style={styles.speedText(theme)}>{speedDisplay}</span>
        </div>
      )}

      {/* Countdown timer */}
      <div style={styles.timer(timerColor)}>
        {minutes}:{seconds}
      </div>

      {/* Bottom action bar */}
      <div style={styles.actionBar}>
        <button
          style={styles.actionBtn(theme, isRecording ? '#ff4466' : null)}
          onClick={toggleRecording}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? '⏹' : '⏺'}
        </button>

        <button
          style={styles.actionBtn(theme)}
          onClick={capturePhoto}
          title="Take photo"
        >
          📷
        </button>

        {!started ? (
          <button
            style={styles.startBtn(theme)}
            onClick={handleStart}
            disabled={!canStart}
          >
            {!isReady ? 'Camera…' : !isDetectorsReady ? 'Loading AI…' : 'START'}
          </button>
        ) : (
          <button style={styles.endBtn} onClick={handleEnd}>
            END
          </button>
        )}

        <button
          style={styles.actionBtn(theme, autoCapture ? theme.accent : null)}
          onClick={() => setAutoCapture((v) => !v)}
          title="Auto-capture on pop"
        >
          {autoCapture ? '🔴' : '🎯'}
        </button>

        <button
          style={styles.actionBtn(theme)}
          onClick={flipCamera}
          title="Flip camera"
        >
          🔄
        </button>
      </div>

      {/* Ring light controls */}
      <RingLightControls canvasRef={ringCanvasRef} />

      {/* Photo count toast */}
      {photoCount > 0 && (
        <div style={styles.photoToast(theme)}>
          {photoCount} photo{photoCount > 1 ? 's' : ''} captured
        </div>
      )}

      {/* Back to setup */}
      {!started && (
        <button
          style={styles.backBtn(theme)}
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.SETUP })}
        >
          ← Setup
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed', inset: 0,
    background: '#000',
    overflow: 'hidden',
  },
  hiddenVideo: { display: 'none' },
  canvas: {
    width: '100%', height: '100%',
    objectFit: 'cover', display: 'block',
  },
  ringCanvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
  },
  recIndicator: {
    position: 'absolute', top: 16, left: 16,
    display: 'flex', alignItems: 'center', gap: 6,
    color: '#fff', fontSize: 13, fontWeight: 700,
    background: 'rgba(0,0,0,0.55)',
    padding: '5px 10px', borderRadius: 20,
    backdropFilter: 'blur(4px)',
  },
  recDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#ff4466',
    display: 'inline-block',
    animation: 'pulse 1s infinite',
  },
  popCounter: (theme) => ({
    position: 'absolute', top: 20,
    left: '50%', transform: 'translateX(-50%)',
    textAlign: 'center',
    background: 'rgba(0,0,0,0.55)',
    padding: '8px 24px', borderRadius: 20,
    backdropFilter: 'blur(8px)',
    border: `1px solid ${theme.accent}44`,
  }),
  popNum: (theme) => ({
    display: 'block',
    fontSize: 52, fontWeight: 900,
    color: theme.accent,
    lineHeight: 1,
    textShadow: `0 0 20px ${theme.accent}88`,
  }),
  popLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2,
  },
  speedBadge: (theme) => ({
    position: 'absolute', top: 20, right: 16,
    background: 'rgba(0,0,0,0.6)',
    borderRadius: 12, padding: '8px 12px',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${theme.accent}33`,
    display: 'flex', alignItems: 'center', gap: 4,
  }),
  speedIcon: { fontSize: 16 },
  speedText: (theme) => ({
    color: theme.accent, fontSize: 14, fontWeight: 700,
  }),
  timer: (color) => ({
    position: 'absolute',
    bottom: 100,
    left: '50%', transform: 'translateX(-50%)',
    fontSize: 44, fontWeight: 900,
    color,
    textShadow: `0 0 30px ${color}88`,
    background: 'rgba(0,0,0,0.45)',
    padding: '6px 24px', borderRadius: 16,
    backdropFilter: 'blur(8px)',
    fontVariantNumeric: 'tabular-nums',
  }),
  actionBar: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: '0 16px',
  },
  actionBtn: (theme, bg = null) => ({
    width: 44, height: 44, borderRadius: '50%',
    border: `1px solid ${bg ?? 'rgba(255,255,255,0.2)'}`,
    background: bg ? bg + '33' : 'rgba(0,0,0,0.6)',
    color: bg ?? theme.accent,
    fontSize: 20, cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  startBtn: (theme) => ({
    padding: '12px 32px', borderRadius: 24,
    border: 'none', background: theme.accent,
    color: '#000', fontWeight: 800, fontSize: 17,
    cursor: 'pointer', letterSpacing: 1,
  }),
  endBtn: {
    padding: '12px 32px', borderRadius: 24,
    border: 'none', background: '#ff4466',
    color: '#fff', fontWeight: 800, fontSize: 17,
    cursor: 'pointer',
  },
  photoToast: (theme) => ({
    position: 'absolute', top: 80, right: 16,
    background: theme.accent,
    color: '#000', fontSize: 12, fontWeight: 700,
    padding: '6px 12px', borderRadius: 10,
  }),
  backBtn: (theme) => ({
    position: 'absolute', top: 16, left: 16,
    background: 'none', border: 'none',
    color: theme.accent, fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  }),
};
