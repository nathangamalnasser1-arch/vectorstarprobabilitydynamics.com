import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase modules globally
vi.mock('../lib/firebase.js', () => ({
  auth: { onAuthStateChanged: vi.fn() },
  db: {},
  storage: {},
  googleProvider: {},
}));

// Mock OpenCV (cv) global for tests
global.cv = {
  imread: vi.fn(() => ({ delete: vi.fn() })),
  Mat: vi.fn(() => ({ delete: vi.fn(), data32F: [], cols: 0 })),
  MatVector: vi.fn(() => ({ delete: vi.fn(), size: vi.fn(() => 0), get: vi.fn() })),
  BackgroundSubtractorMOG2: vi.fn(() => ({ apply: vi.fn(), delete: vi.fn() })),
  Size: vi.fn((w, h) => ({ width: w, height: h })),
  cvtColor: vi.fn(),
  GaussianBlur: vi.fn(),
  HoughCircles: vi.fn(),
  threshold: vi.fn(),
  findContours: vi.fn(),
  boundingRect: vi.fn(() => ({ x: 10, y: 10, width: 90, height: 90 })),
  contourArea: vi.fn(() => 8100),
  COLOR_RGBA2GRAY: 0,
  THRESH_BINARY: 1,
  RETR_EXTERNAL: 0,
  CHAIN_APPROX_SIMPLE: 1,
  HOUGH_GRADIENT: 3,
};

// Silence console errors in tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
