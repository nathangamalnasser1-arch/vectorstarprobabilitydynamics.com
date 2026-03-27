import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';

const RAINBOW_COLORS = [
  '#ff0000', '#ff4400', '#ff8800', '#ffcc00',
  '#00ff44', '#00ccff', '#0044ff', '#8800ff', '#cc00ff',
];

export function useRingLight(canvasRef) {
  const { state, dispatch } = useApp();
  const { ringLight } = state;
  const rafRef = useRef(null);
  const rainbowIndexRef = useRef(0);
  const flashRef = useRef(false);

  const updateRingLight = useCallback(() => {
    const { enabled, color, intensity, thickness, isRainbow } = ringLight;
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear ring area
    ctx.clearRect(0, 0, w, h);

    if (!enabled && !flashRef.current) return;

    let activeColor = color;

    if (isRainbow || color === 'rainbow') {
      activeColor = RAINBOW_COLORS[Math.floor(rainbowIndexRef.current) % RAINBOW_COLORS.length];
      rainbowIndexRef.current += 0.05;
    }

    const alpha = flashRef.current ? 1.0 : intensity;
    const t = flashRef.current ? Math.min(thickness * 3, w / 2) : thickness;

    // Draw ring as layered gradients on all 4 edges
    ctx.globalAlpha = alpha;

    // Top edge
    const topGrad = ctx.createLinearGradient(0, 0, 0, t);
    topGrad.addColorStop(0, activeColor);
    topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, t);

    // Bottom edge
    const botGrad = ctx.createLinearGradient(0, h, 0, h - t);
    botGrad.addColorStop(0, activeColor);
    botGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h - t, w, t);

    // Left edge
    const leftGrad = ctx.createLinearGradient(0, 0, t, 0);
    leftGrad.addColorStop(0, activeColor);
    leftGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, t, h);

    // Right edge
    const rightGrad = ctx.createLinearGradient(w, 0, w - t, 0);
    rightGrad.addColorStop(0, activeColor);
    rightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(w - t, 0, t, h);

    ctx.globalAlpha = 1.0;

    if (flashRef.current) {
      flashRef.current = false;
    }
  }, [ringLight, canvasRef]);

  // Animate rainbow / keep ring updated
  useEffect(() => {
    const animate = () => {
      updateRingLight();
      rafRef.current = requestAnimationFrame(animate);
    };

    if (ringLight.enabled || ringLight.isRainbow) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      updateRingLight(); // one final draw to clear
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [ringLight, updateRingLight]);

  // Listen for punch / pop events to trigger flash
  useEffect(() => {
    const onPunch = () => {
      if (ringLight.pulseOnPunch) {
        flashRef.current = true;
        updateRingLight();
        setTimeout(() => updateRingLight(), 120);
      }
    };

    const onPop = () => {
      if (ringLight.flashOnPop) {
        flashRef.current = true;
        updateRingLight();
        setTimeout(() => updateRingLight(), 150);
      }
    };

    window.addEventListener('punch-detected', onPunch);
    window.addEventListener('bubble-pop', onPop);
    return () => {
      window.removeEventListener('punch-detected', onPunch);
      window.removeEventListener('bubble-pop', onPop);
    };
  }, [ringLight, updateRingLight]);

  const toggle = () =>
    dispatch({ type: 'SET_RING_LIGHT', payload: { enabled: !ringLight.enabled } });

  const setColor = (color) =>
    dispatch({
      type: 'SET_RING_LIGHT',
      payload: { color, isRainbow: color === 'rainbow' },
    });

  const setIntensity = (intensity) =>
    dispatch({ type: 'SET_RING_LIGHT', payload: { intensity } });

  const setThickness = (thickness) =>
    dispatch({ type: 'SET_RING_LIGHT', payload: { thickness } });

  const setPulseOnPunch = (v) =>
    dispatch({ type: 'SET_RING_LIGHT', payload: { pulseOnPunch: v } });

  const setFlashOnPop = (v) =>
    dispatch({ type: 'SET_RING_LIGHT', payload: { flashOnPop: v } });

  return { toggle, setColor, setIntensity, setThickness, setPulseOnPunch, setFlashOnPop };
}
