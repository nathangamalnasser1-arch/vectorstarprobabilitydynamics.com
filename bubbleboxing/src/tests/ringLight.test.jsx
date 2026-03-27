import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext.jsx';

// Helper component to read ring light state
function RingReader({ onRead }) {
  const { state } = useApp();
  onRead(state.ringLight);
  return null;
}

function RingWriter({ actions }) {
  const { dispatch } = useApp();
  actions.current = dispatch;
  return null;
}

describe('Ring light state management', () => {
  let captured = null;
  let dispatch = { current: null };

  const setup = () =>
    render(
      <AppProvider>
        <RingReader onRead={(rl) => { captured = rl; }} />
        <RingWriter actions={dispatch} />
      </AppProvider>
    );

  it('starts with ring light off', () => {
    setup();
    expect(captured.enabled).toBe(false);
  });

  it('toggles ring light on', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { enabled: true } });
    });
    expect(captured.enabled).toBe(true);
  });

  it('sets ring light color', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { color: '#ff2244' } });
    });
    expect(captured.color).toBe('#ff2244');
  });

  it('sets intensity within range', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { intensity: 0.5 } });
    });
    expect(captured.intensity).toBe(0.5);
  });

  it('sets thickness', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { thickness: 60 } });
    });
    expect(captured.thickness).toBe(60);
  });

  it('enables pulse on punch', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { pulseOnPunch: true } });
    });
    expect(captured.pulseOnPunch).toBe(true);
  });

  it('enables flash on pop', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { flashOnPop: true } });
    });
    expect(captured.flashOnPop).toBe(true);
  });

  it('sets rainbow mode when color is "rainbow"', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { color: 'rainbow', isRainbow: true } });
    });
    expect(captured.isRainbow).toBe(true);
  });

  it('partial update preserves other properties', () => {
    setup();
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { enabled: true, color: '#00ff88' } });
    });
    act(() => {
      dispatch.current({ type: 'SET_RING_LIGHT', payload: { intensity: 0.9 } });
    });
    expect(captured.enabled).toBe(true);
    expect(captured.color).toBe('#00ff88');
    expect(captured.intensity).toBe(0.9);
  });
});
