import { describe, it, expect } from 'vitest';
import {
  normSpeedToReal,
  computePixelsPerCm,
  classifySpeed,
  averageSpeed,
} from '../lib/speedCalculator.js';

describe('computePixelsPerCm', () => {
  it('computes correct ratio for a 30cm square marker', () => {
    const markerRect = { x: 0, y: 0, width: 120, height: 120 };
    const pxPerCm = computePixelsPerCm(markerRect, 30);
    expect(pxPerCm).toBe(4); // 120px / 30cm = 4px/cm
  });

  it('averages width and height for slightly rectangular markers', () => {
    const markerRect = { x: 0, y: 0, width: 100, height: 120 };
    const pxPerCm = computePixelsPerCm(markerRect, 30);
    expect(pxPerCm).toBeCloseTo(3.667, 2); // (100+120)/2/30
  });

  it('uses a custom real-world size', () => {
    const markerRect = { x: 0, y: 0, width: 200, height: 200 };
    const pxPerCm = computePixelsPerCm(markerRect, 20);
    expect(pxPerCm).toBe(10);
  });
});

describe('normSpeedToReal', () => {
  it('returns null when pixelsPerCm is not set', () => {
    expect(normSpeedToReal(0.05, null, 1280)).toBeNull();
    expect(normSpeedToReal(0.05, 0, 1280)).toBeNull();
  });

  it('converts a known normalized speed to km/h correctly', () => {
    // speedNorm=0.05, videoWidth=1280, pixelsPerCm=4, fps=30
    // pixelsPerFrame = 0.05 * 1280 = 64px
    // cmPerFrame = 64 / 4 = 16cm
    // cmPerSec = 16 * 30 = 480 cm/s
    // kmh = (480/100) * 3.6 = 17.28 → rounded 17
    const result = normSpeedToReal(0.05, 4, 1280, 30);
    expect(result).not.toBeNull();
    expect(result.kmh).toBe(17);
  });

  it('converts kmh to mph correctly', () => {
    const result = normSpeedToReal(0.05, 4, 1280, 30);
    expect(result.mph).toBe(Math.round(17 * 0.621371));
  });

  it('returns higher speed for larger normalized value', () => {
    const slow = normSpeedToReal(0.02, 4, 1280, 30);
    const fast = normSpeedToReal(0.08, 4, 1280, 30);
    expect(fast.kmh).toBeGreaterThan(slow.kmh);
  });
});

describe('classifySpeed', () => {
  it('classifies very slow movement', () => {
    expect(classifySpeed(0)).toBe('Slow');
    expect(classifySpeed(0.01)).toBe('Slow');
  });

  it('classifies medium speed', () => {
    expect(classifySpeed(0.015)).toBe('Medium');
    expect(classifySpeed(0.03)).toBe('Medium');
  });

  it('classifies fast speed', () => {
    expect(classifySpeed(0.035)).toBe('Fast');
    expect(classifySpeed(0.055)).toBe('Fast');
  });

  it('classifies lightning speed', () => {
    expect(classifySpeed(0.06)).toBe('Lightning');
    expect(classifySpeed(0.15)).toBe('Lightning');
  });
});

describe('averageSpeed', () => {
  it('returns 0 for empty array', () => {
    expect(averageSpeed([])).toBe(0);
    expect(averageSpeed(null)).toBe(0);
  });

  it('returns the single value for one punch', () => {
    expect(averageSpeed([{ speedNorm: 0.04 }])).toBeCloseTo(0.04);
  });

  it('averages correctly across multiple punches', () => {
    const events = [
      { speedNorm: 0.02 },
      { speedNorm: 0.04 },
      { speedNorm: 0.06 },
    ];
    expect(averageSpeed(events)).toBeCloseTo(0.04);
  });
});
