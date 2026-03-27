import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BubbleDetector } from '../lib/bubbleDetector.js';

describe('BubbleDetector', () => {
  let detector;
  let onPopSpy;

  beforeEach(() => {
    onPopSpy = vi.fn();
    detector = new BubbleDetector({ onPop: onPopSpy, disappearFrameThreshold: 2 });
    detector._isReady = true; // skip OpenCV init in tests
  });

  it('starts with zero pop count', () => {
    expect(detector.popCount).toBe(0);
  });

  it('registers a new bubble as tracked', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    expect(detector._trackedBubbles.size).toBe(1);
  });

  it('matches a tracked bubble to the nearest detection', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    detector._updateTracking([{ cx: 105, cy: 103, r: 30 }]);
    expect(detector._trackedBubbles.size).toBe(1);
    const bubble = [...detector._trackedBubbles.values()][0];
    expect(bubble.cx).toBe(105);
    expect(bubble.missedFrames).toBe(0);
  });

  it('increments missedFrames when bubble disappears', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    detector._updateTracking([]); // bubble gone frame 1
    const bubble = [...detector._trackedBubbles.values()][0];
    expect(bubble.missedFrames).toBe(1);
    expect(detector.popCount).toBe(0); // not yet
  });

  it('counts a pop after disappearFrameThreshold missed frames', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    detector._updateTracking([]); // frame 1 miss
    detector._updateTracking([]); // frame 2 miss → threshold reached
    expect(detector.popCount).toBe(1);
    expect(onPopSpy).toHaveBeenCalledWith(1);
    expect(detector._trackedBubbles.size).toBe(0);
  });

  it('does not confuse two close bubbles as one', () => {
    detector._updateTracking([
      { cx: 50, cy: 50, r: 20 },
      { cx: 200, cy: 200, r: 20 },
    ]);
    expect(detector._trackedBubbles.size).toBe(2);
  });

  it('counts multiple pops independently', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    detector._updateTracking([]);
    detector._updateTracking([]); // first pop
    detector._updateTracking([{ cx: 200, cy: 200, r: 25 }]);
    detector._updateTracking([]);
    detector._updateTracking([]); // second pop
    expect(detector.popCount).toBe(2);
    expect(onPopSpy).toHaveBeenCalledTimes(2);
  });

  it('resets state correctly', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    detector._popCount = 5;
    detector.reset();
    expect(detector.popCount).toBe(0);
    expect(detector._trackedBubbles.size).toBe(0);
  });

  it('creates a new bubble ID for each unique detection', () => {
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }]);
    detector._updateTracking([{ cx: 100, cy: 100, r: 30 }, { cx: 300, cy: 300, r: 20 }]);
    expect(detector._trackedBubbles.size).toBe(2);
  });
});
