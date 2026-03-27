import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async (facing = facingMode) => {
    setError(null);
    setIsReady(false);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setFacingMode(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;

        const onReady = () => {
          videoRef.current?.play();
          setIsReady(true);
        };

        if (videoRef.current.readyState >= 1) {
          // metadata already loaded — event already fired, call directly
          onReady();
        } else {
          videoRef.current.addEventListener('loadedmetadata', onReady, { once: true });
        }
      }

      // Request wake lock to keep screen on
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    }
  }, [stream, facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setIsReady(false);
    }
  }, [stream]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    startCamera(next);
  }, [facingMode, startCamera]);

  return {
    videoRef,
    stream,
    facingMode,
    error,
    isReady,
    startCamera,
    stopCamera,
    flipCamera,
  };
}
