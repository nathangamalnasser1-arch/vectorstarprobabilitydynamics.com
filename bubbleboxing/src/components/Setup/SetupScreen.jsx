import { useEffect, useRef, useState } from 'react';
import { useApp, SCREENS } from '../../context/AppContext.jsx';
import { useCamera } from '../../hooks/useCamera.js';
import { detectCalibrationMarker, drawMarkerOverlay } from '../../lib/calibration.js';
import RingLightControls from '../RingLight/RingLightControls.jsx';

export default function SetupScreen() {
  const { state, dispatch } = useApp();
  const { theme } = state;
  const { videoRef, error, isReady, startCamera, flipCamera, facingMode } = useCamera();
  const canvasRef = useRef(null);
  const ringCanvasRef = useRef(null);
  const [calibrated, setCalibrated] = useState(false);
  const [calibStatus, setCalibStatus] = useState('Place a 30cm × 30cm white square on the floor');
  const rafRef = useRef(null);

  useEffect(() => {
    startCamera('environment');
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Mirror video to canvas + attempt calibration
  useEffect(() => {
    if (!isReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const draw = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try calibration every 30 frames
      if (typeof cv !== 'undefined' && Math.random() < 0.033) {
        const result = detectCalibrationMarker(canvas);
        if (result) {
          drawMarkerOverlay(canvas, result.markerRect);
          dispatch({
            type: 'UPDATE_SESSION',
            payload: { pixelsPerCm: result.pixelsPerCm },
          });
          setCalibrated(true);
          setCalibStatus(`Calibrated! ${result.pixelsPerCm.toFixed(1)} px/cm`);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isReady, dispatch]);

  const handleStart = () => {
    cancelAnimationFrame(rafRef.current);
    dispatch({ type: 'GO_TO', payload: SCREENS.SESSION });
  };

  return (
    <div style={styles.container(theme)}>
      <div style={styles.header}>
        <button
          style={styles.backBtn(theme)}
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.ONBOARDING })}
        >
          ← Back
        </button>
        <h2 style={styles.title(theme)}>Setup</h2>
        <button style={styles.backBtn(theme)} onClick={flipCamera}>
          {facingMode === 'user' ? '📷 Rear' : '🤳 Front'}
        </button>
      </div>

      {/* Camera preview */}
      <div style={styles.previewWrap}>
        <video ref={videoRef} style={styles.hiddenVideo} playsInline muted />
        <canvas ref={canvasRef} style={styles.canvas} />
        <canvas ref={ringCanvasRef} style={styles.ringCanvas} />
        {!isReady && (
          <div style={styles.cameraPlaceholder(theme)}>
            {error ? `Camera error: ${error}` : 'Starting camera…'}
          </div>
        )}
      </div>

      {/* Calibration status */}
      <div style={styles.calibBadge(calibrated, theme)}>
        <span>{calibrated ? '✓' : '⏳'}</span>
        <span>{calibStatus}</span>
      </div>

      {/* Ring light controls */}
      <RingLightControls canvasRef={ringCanvasRef} />

      {/* History shortcut */}
      <div style={styles.nav}>
        <button
          style={styles.navBtn(theme)}
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.HISTORY })}
        >
          📊 History
        </button>

        <button style={styles.startBtn(theme)} onClick={handleStart}>
          Start Session →
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: (theme) => ({
    minHeight: '100dvh',
    background: theme.bg,
    display: 'flex',
    flexDirection: 'column',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
  },
  backBtn: (theme) => ({
    background: 'none',
    border: 'none',
    color: theme.accent,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }),
  title: (theme) => ({
    color: theme.text,
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  }),
  previewWrap: {
    position: 'relative',
    flex: 1,
    background: '#000',
    maxHeight: '55dvh',
    overflow: 'hidden',
  },
  hiddenVideo: { display: 'none' },
  canvas: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  ringCanvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  cameraPlaceholder: (theme) => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.dimText,
    fontSize: 14,
    background: '#050810',
  }),
  calibBadge: (ok, theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    margin: '12px 16px',
    borderRadius: 10,
    background: ok ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${ok ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.08)'}`,
    color: ok ? '#00ff88' : theme.dimText,
    fontSize: 13,
    fontWeight: 500,
  }),
  nav: {
    display: 'flex',
    gap: 12,
    padding: '16px 16px 32px',
  },
  navBtn: (theme) => ({
    flex: 1,
    padding: '13px',
    borderRadius: 12,
    border: `1px solid rgba(255,255,255,0.1)`,
    background: 'transparent',
    color: theme.text,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  }),
  startBtn: (theme) => ({
    flex: 2,
    padding: '13px',
    borderRadius: 12,
    border: 'none',
    background: theme.accent,
    color: '#000',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  }),
};
