import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSpeedRating } from '../lib/punchDetector.js';

// We test the pure logic of PunchDetector's velocity calculation separately
// since the full class requires async MediaPipe init.

describe('getSpeedRating', () => {
  it('returns Slow for very small speeds', () => {
    expect(getSpeedRating(0)).toBe('Slow');
    expect(getSpeedRating(0.005)).toBe('Slow');
  });

  it('returns Medium for moderate speed', () => {
    expect(getSpeedRating(0.015)).toBe('Medium');
    expect(getSpeedRating(0.025)).toBe('Medium');
  });

  it('returns Fast for high speed', () => {
    expect(getSpeedRating(0.035)).toBe('Fast');
    expect(getSpeedRating(0.05)).toBe('Fast');
  });

  it('returns Lightning for very high speed', () => {
    expect(getSpeedRating(0.06)).toBe('Lightning');
    expect(getSpeedRating(0.1)).toBe('Lightning');
  });
});

// Simulate punch detection logic (extracted so it's testable)
function simulatePunchDetection(prevKeypoints, currentKeypoints, threshold = 0.015) {
  if (!prevKeypoints) return null;
  const dx = currentKeypoints.x - prevKeypoints.x;
  const dy = currentKeypoints.y - prevKeypoints.y;
  const dz = currentKeypoints.z - prevKeypoints.z;
  const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (speed >= threshold) {
    return { speedNorm: speed, rating: getSpeedRating(speed) };
  }
  return null;
}

describe('Punch detection velocity logic', () => {
  it('does not fire for slow movement', () => {
    const prev = { x: 0.5, y: 0.5, z: 0 };
    const curr = { x: 0.501, y: 0.500, z: 0 };
    expect(simulatePunchDetection(prev, curr)).toBeNull();
  });

  it('fires for fast forward movement', () => {
    const prev = { x: 0.5, y: 0.5, z: 0.1 };
    const curr = { x: 0.55, y: 0.52, z: 0.03 };
    const result = simulatePunchDetection(prev, curr);
    expect(result).not.toBeNull();
    expect(result.rating).toMatch(/Medium|Fast|Lightning/);
  });

  it('does not fire when prev keypoints are null (first frame)', () => {
    const curr = { x: 0.5, y: 0.5, z: 0 };
    expect(simulatePunchDetection(null, curr)).toBeNull();
  });

  it('correctly classifies a lightning punch', () => {
    const prev = { x: 0.3, y: 0.5, z: 0.1 };
    const curr = { x: 0.3, y: 0.5, z: -0.08 };
    const result = simulatePunchDetection(prev, curr);
    expect(result).not.toBeNull();
    expect(result.rating).toBe('Lightning');
  });

  it('returns correct speedNorm value', () => {
    const prev = { x: 0, y: 0, z: 0 };
    const curr = { x: 0.03, y: 0.04, z: 0 };
    const result = simulatePunchDetection(prev, curr);
    expect(result?.speedNorm).toBeCloseTo(0.05, 2);
  });
});
