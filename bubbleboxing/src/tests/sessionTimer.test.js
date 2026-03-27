import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * SessionTimer — unit-testable timer logic extracted for testing.
 * The real useSession hook wraps this in a setInterval tied to React state.
 */
class SessionTimer {
  constructor({ duration = 180, onTick, onEnd }) {
    this.duration = duration;
    this.timeLeft = duration;
    this.onTick = onTick ?? (() => {});
    this.onEnd = onEnd ?? (() => {});
    this._interval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._interval = setInterval(() => {
      this.timeLeft -= 1;
      this.onTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.stop();
        this.onEnd();
      }
    }, 1000);
  }

  stop() {
    clearInterval(this._interval);
    this._interval = null;
    this.isRunning = false;
  }

  reset() {
    this.stop();
    this.timeLeft = this.duration;
  }
}

describe('SessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with full duration', () => {
    const timer = new SessionTimer({ duration: 180 });
    expect(timer.timeLeft).toBe(180);
    expect(timer.isRunning).toBe(false);
  });

  it('decrements every second after start', () => {
    const onTick = vi.fn();
    const timer = new SessionTimer({ duration: 10, onTick });
    timer.start();
    vi.advanceTimersByTime(3000);
    expect(timer.timeLeft).toBe(7);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('calls onEnd after full duration', () => {
    const onEnd = vi.fn();
    const timer = new SessionTimer({ duration: 3, onEnd });
    timer.start();
    vi.advanceTimersByTime(3000);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(timer.isRunning).toBe(false);
  });

  it('does not go below 0', () => {
    const timer = new SessionTimer({ duration: 2 });
    timer.start();
    vi.advanceTimersByTime(5000);
    expect(timer.timeLeft).toBe(0);
  });

  it('stops when stop() is called mid-session', () => {
    const onTick = vi.fn();
    const timer = new SessionTimer({ duration: 10, onTick });
    timer.start();
    vi.advanceTimersByTime(3000);
    timer.stop();
    vi.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(3); // only 3 ticks before stop
    expect(timer.isRunning).toBe(false);
  });

  it('resets correctly', () => {
    const timer = new SessionTimer({ duration: 10 });
    timer.start();
    vi.advanceTimersByTime(5000);
    timer.reset();
    expect(timer.timeLeft).toBe(10);
    expect(timer.isRunning).toBe(false);
  });

  it('does not double-start', () => {
    const onTick = vi.fn();
    const timer = new SessionTimer({ duration: 10, onTick });
    timer.start();
    timer.start(); // second call should be ignored
    vi.advanceTimersByTime(2000);
    expect(onTick).toHaveBeenCalledTimes(2); // not 4
  });

  it('fires exactly 180 ticks for a 3-minute session', () => {
    const onTick = vi.fn();
    const onEnd = vi.fn();
    const timer = new SessionTimer({ duration: 180, onTick, onEnd });
    timer.start();
    vi.advanceTimersByTime(180000);
    expect(onTick).toHaveBeenCalledTimes(180);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
