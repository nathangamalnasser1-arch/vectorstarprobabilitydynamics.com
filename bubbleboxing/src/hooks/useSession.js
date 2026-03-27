import { useRef, useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { BubbleDetector } from '../lib/bubbleDetector.js';
import { PunchDetector } from '../lib/punchDetector.js';
import { averageSpeed } from '../lib/speedCalculator.js';
import { SESSION_DURATION_SECONDS } from '../styles/themes.js';

export function useSession() {
  const { state, dispatch, SCREENS } = useApp();
  const bubbleDetectorRef = useRef(null);
  const punchDetectorRef = useRef(null);
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const punchEventsRef = useRef([]);
  const [isDetectorsReady, setIsDetectorsReady] = useState(false);

  // Pre-init detectors on mount so START has zero wait time
  useEffect(() => {
    let cancelled = false;

    const bd = new BubbleDetector({
      onPop: (count) => {
        dispatch({ type: 'UPDATE_SESSION', payload: { popCount: count } });
        window.dispatchEvent(new CustomEvent('bubble-pop'));
      },
    });
    bd.init();
    bubbleDetectorRef.current = bd;

    const pd = new PunchDetector({
      onPunch: (event) => {
        punchEventsRef.current = [...punchEventsRef.current, event];
        dispatch({
          type: 'UPDATE_SESSION',
          payload: {
            punchEvents: punchEventsRef.current,
            lastPunchRating: event.rating,
            lastPunchSpeed: event.speedNorm,
          },
        });
        window.dispatchEvent(new CustomEvent('punch-detected', { detail: event }));
      },
    });

    pd.init().then(() => {
      if (!cancelled) {
        punchDetectorRef.current = pd;
        setIsDetectorsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const startSession = useCallback(
    async (videoEl, canvasEl) => {
      dispatch({ type: 'RESET_SESSION' });
      punchEventsRef.current = [];

      dispatch({ type: 'UPDATE_SESSION', payload: { isRunning: true, timeLeft: SESSION_DURATION_SECONDS } });

      let timeLeft = SESSION_DURATION_SECONDS;
      timerRef.current = setInterval(() => {
        timeLeft -= 1;
        dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft } });
        if (timeLeft <= 0) endSession();
      }, 1000);

      // Small offscreen canvas for OpenCV — 16x fewer pixels than 1280x720
      const cvCanvas = document.createElement('canvas');
      cvCanvas.width = 320;
      cvCanvas.height = 180;
      const cvCtx = cvCanvas.getContext('2d');
      let frameCount = 0;
      let cvSkipUntil = 0; // adaptive throttle: skip CV if last run was too slow

      // rAF loop for frame processing
      const processLoop = (timestamp) => {
        if (timeLeft <= 0) return;

        if (videoEl && videoEl.readyState >= 2) {
          // Sync canvas pixel dimensions to video resolution
          if (canvasEl.width !== videoEl.videoWidth) canvasEl.width = videoEl.videoWidth || 640;
          if (canvasEl.height !== videoEl.videoHeight) canvasEl.height = videoEl.videoHeight || 480;

          // Draw video to display canvas at full resolution
          const ctx = canvasEl.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

          frameCount++;

          // Bubble detection — every 3rd frame, skip if CV is running slow
          if (frameCount % 3 === 0 && bubbleDetectorRef.current?._isReady && timestamp >= cvSkipUntil) {
            const t0 = performance.now();
            cvCtx.drawImage(videoEl, 0, 0, 320, 180);
            bubbleDetectorRef.current.processFrame(cvCanvas);
            const elapsed = performance.now() - t0;
            // If CV took >40ms, back off for the next 6 frames (~200ms at 30fps)
            if (elapsed > 40) cvSkipUntil = timestamp + elapsed * 6;
          }

          // Punch detection — every 2nd frame, 16ms budget
          if (frameCount % 2 === 0 && punchDetectorRef.current?._isReady) {
            punchDetectorRef.current.processFrame(videoEl, timestamp);
          }
        }

        rafRef.current = requestAnimationFrame(processLoop);
      };

      rafRef.current = requestAnimationFrame(processLoop);
    },
    [dispatch, initDetectors, state.session.isRunning]
  );

  const endSession = useCallback(() => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);

    if (bubbleDetectorRef.current) bubbleDetectorRef.current.reset();
    if (punchDetectorRef.current) punchDetectorRef.current.reset();

    const events = punchEventsRef.current;
    const summary = {
      totalPops: bubbleDetectorRef.current?.popCount ?? 0,
      punchEvents: events,
      averageSpeed: averageSpeed(events),
      duration: SESSION_DURATION_SECONDS,
    };

    dispatch({ type: 'UPDATE_SESSION', payload: { isRunning: false } });
    dispatch({ type: 'SET_LAST_SESSION', payload: summary });
    dispatch({ type: 'GO_TO', payload: SCREENS.SUMMARY });
  }, [dispatch, SCREENS]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      bubbleDetectorRef.current?.destroy();
      punchDetectorRef.current?.destroy();
    };
  }, []);

  return { startSession, endSession, isDetectorsReady };
}
