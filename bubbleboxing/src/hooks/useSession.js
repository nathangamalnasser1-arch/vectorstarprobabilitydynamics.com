import { useRef, useCallback, useEffect } from 'react';
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
  const punchEventsRef = useRef([]); // avoid stale closure in rAF

  const initDetectors = useCallback(async () => {
    // Init bubble detector (needs OpenCV)
    const bd = new BubbleDetector({
      onPop: (count) => {
        dispatch({ type: 'UPDATE_SESSION', payload: { popCount: count } });
        // Trigger pop flash via custom event
        window.dispatchEvent(new CustomEvent('bubble-pop'));
      },
    });
    bd.init();
    bubbleDetectorRef.current = bd;

    // Init punch detector (async, loads MediaPipe model)
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
    await pd.init();
    punchDetectorRef.current = pd;
  }, [dispatch]);

  const startSession = useCallback(
    async (videoEl, canvasEl) => {
      dispatch({ type: 'RESET_SESSION' });
      punchEventsRef.current = [];

      await initDetectors();

      dispatch({ type: 'UPDATE_SESSION', payload: { isRunning: true, timeLeft: SESSION_DURATION_SECONDS } });

      let timeLeft = SESSION_DURATION_SECONDS;
      timerRef.current = setInterval(() => {
        timeLeft -= 1;
        dispatch({ type: 'UPDATE_SESSION', payload: { timeLeft } });
        if (timeLeft <= 0) endSession();
      }, 1000);

      // rAF loop for frame processing
      const processLoop = (timestamp) => {
        if (!state.session.isRunning && timeLeft <= 0) return;

        if (videoEl && videoEl.readyState >= 2) {
          // Draw video to canvas
          const ctx = canvasEl.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

          // Bubble detection
          if (bubbleDetectorRef.current?._isReady) {
            bubbleDetectorRef.current.processFrame(canvasEl);
          }

          // Punch detection
          if (punchDetectorRef.current?._isReady) {
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

  return { startSession, endSession };
}
