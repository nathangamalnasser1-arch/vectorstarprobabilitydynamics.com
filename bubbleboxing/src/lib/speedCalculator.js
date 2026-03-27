/**
 * SpeedCalculator — converts normalized pixel velocity to real-world speed.
 *
 * Requires a calibration ratio (pixelsPerCm) computed from a known
 * 30cm × 30cm marker placed on the floor.
 */

const FRAME_RATE = 30; // assumed fps for real-speed conversion

/**
 * @param {number} speedNorm   - normalized speed (0–1 range from MediaPipe landmarks)
 * @param {number} pixelsPerCm - calibration ratio
 * @param {number} videoWidth  - video frame width in pixels
 * @param {number} fps         - actual frames per second
 * @returns {{ kmh: number, mph: number }}
 */
export function normSpeedToReal(speedNorm, pixelsPerCm, videoWidth, fps = FRAME_RATE) {
  if (!pixelsPerCm || pixelsPerCm <= 0) return null;

  // MediaPipe normalizes x/y to [0, 1] relative to frame width/height.
  // speedNorm units = fraction of frame width per frame
  const pixelsPerFrame = speedNorm * videoWidth;
  const cmPerFrame = pixelsPerFrame / pixelsPerCm;
  const cmPerSecond = cmPerFrame * fps;
  const kmh = (cmPerSecond / 100) * 3.6;
  const mph = kmh * 0.621371;

  return { kmh: Math.round(kmh), mph: Math.round(mph) };
}

/**
 * Compute pixels-per-cm from a detected square marker.
 * @param {{ x: number, y: number, width: number, height: number }} markerRect
 *   - bounding rect of the detected calibration square in pixels
 * @param {number} markerRealCm - real-world side length of the marker (default 30cm)
 */
export function computePixelsPerCm(markerRect, markerRealCm = 30) {
  const avgPixelSide = (markerRect.width + markerRect.height) / 2;
  return avgPixelSide / markerRealCm;
}

/**
 * Classify normalized speed into a human-readable rating without calibration.
 * @param {number} speedNorm
 * @returns {'Slow'|'Medium'|'Fast'|'Lightning'}
 */
export function classifySpeed(speedNorm) {
  if (speedNorm >= 0.06) return 'Lightning';
  if (speedNorm >= 0.035) return 'Fast';
  if (speedNorm >= 0.015) return 'Medium';
  return 'Slow';
}

/**
 * Compute average punch speed from an array of punch events.
 * @param {Array<{ speedNorm: number }>} punchEvents
 */
export function averageSpeed(punchEvents) {
  if (!punchEvents || punchEvents.length === 0) return 0;
  const sum = punchEvents.reduce((acc, e) => acc + e.speedNorm, 0);
  return sum / punchEvents.length;
}
