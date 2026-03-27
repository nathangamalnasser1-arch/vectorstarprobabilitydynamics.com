/**
 * Calibration — detects a known white square marker on the floor
 * using OpenCV.js contour detection.
 *
 * Requires OpenCV.js loaded globally.
 */

import { computePixelsPerCm } from './speedCalculator.js';

const MARKER_REAL_CM = 30;

/**
 * Attempt to detect the calibration marker in a canvas/video frame.
 * @param {HTMLCanvasElement|HTMLVideoElement} source
 * @returns {{ pixelsPerCm: number, markerRect: object } | null}
 */
export function detectCalibrationMarker(source) {
  if (typeof cv === 'undefined') return null;

  const src = cv.imread(source);
  const gray = new cv.Mat();
  const thresh = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, thresh, 200, 255, cv.THRESH_BINARY);
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let bestRect = null;
    let bestSquareness = Infinity;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      // Filter by area — marker should be reasonably large
      if (area < 2000 || area > 200000) continue;

      const rect = cv.boundingRect(contour);
      const aspectRatio = rect.width / rect.height;
      const squareness = Math.abs(aspectRatio - 1.0);

      // Accept near-square shapes (aspect ratio within 20% of 1.0)
      if (squareness < 0.2 && squareness < bestSquareness) {
        bestSquareness = squareness;
        bestRect = rect;
      }
    }

    if (!bestRect) return null;

    const pixelsPerCm = computePixelsPerCm(bestRect, MARKER_REAL_CM);
    return { pixelsPerCm, markerRect: bestRect };
  } finally {
    src.delete();
    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Draw the detected marker rectangle on a canvas for visual feedback.
 */
export function drawMarkerOverlay(canvas, markerRect) {
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 3;
  ctx.strokeRect(markerRect.x, markerRect.y, markerRect.width, markerRect.height);
  ctx.fillStyle = 'rgba(0,255,136,0.15)';
  ctx.fillRect(markerRect.x, markerRect.y, markerRect.width, markerRect.height);
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('30cm Marker ✓', markerRect.x + 4, markerRect.y - 6);
}
