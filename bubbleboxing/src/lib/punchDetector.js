/**
 * PunchDetector — MediaPipe Hands-based punch detection
 *
 * Uses hand keypoint velocities to detect punch events.
 * A punch is defined as a rapid forward (Z-axis decrease) or
 * large lateral/vertical displacement of the wrist/index MCP keypoints
 * above a velocity threshold, followed by deceleration.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Landmark indices from MediaPipe Hands
const WRIST = 0;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;

const SPEED_THRESHOLDS = {
  slow: 0,
  medium: 0.015,
  fast: 0.035,
  lightning: 0.06,
};

export function getSpeedRating(speedNorm) {
  if (speedNorm >= SPEED_THRESHOLDS.lightning) return 'Lightning';
  if (speedNorm >= SPEED_THRESHOLDS.fast) return 'Fast';
  if (speedNorm >= SPEED_THRESHOLDS.medium) return 'Medium';
  return 'Slow';
}

export class PunchDetector {
  constructor(options = {}) {
    this.onPunch = options.onPunch ?? (() => {});
    this.punchVelocityThreshold = options.punchVelocityThreshold ?? SPEED_THRESHOLDS.medium;
    this.cooldownFrames = options.cooldownFrames ?? 8;

    this._handLandmarker = null;
    this._prevKeypoints = null;
    this._cooldownLeft = 0;
    this._isReady = false;
  }

  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this._handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
      this._isReady = true;
    } catch (err) {
      console.error('PunchDetector init failed:', err);
    }
  }

  /** @param {HTMLVideoElement} videoEl @param {number} timestampMs */
  processFrame(videoEl, timestampMs) {
    if (!this._isReady || !this._handLandmarker) return null;

    const results = this._handLandmarker.detectForVideo(videoEl, timestampMs);

    if (!results.landmarks || results.landmarks.length === 0) {
      this._prevKeypoints = null;
      return null;
    }

    // Use the first detected hand
    const landmarks = results.landmarks[0];
    const wrist = landmarks[WRIST];
    const indexMcp = landmarks[INDEX_MCP];
    const middleMcp = landmarks[MIDDLE_MCP];

    // Fist center = average of wrist + MCP points
    const fistCenter = {
      x: (wrist.x + indexMcp.x + middleMcp.x) / 3,
      y: (wrist.y + indexMcp.y + middleMcp.y) / 3,
      z: (wrist.z + indexMcp.z + middleMcp.z) / 3,
    };

    let punchEvent = null;

    if (this._prevKeypoints && this._cooldownLeft === 0) {
      const dx = fistCenter.x - this._prevKeypoints.x;
      const dy = fistCenter.y - this._prevKeypoints.y;
      const dz = fistCenter.z - this._prevKeypoints.z;
      const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (speed >= this.punchVelocityThreshold) {
        const rating = getSpeedRating(speed);
        punchEvent = { speedNorm: speed, rating, timestamp: timestampMs };
        this._cooldownLeft = this.cooldownFrames;
        this.onPunch(punchEvent);
      }
    }

    if (this._cooldownLeft > 0) this._cooldownLeft--;
    this._prevKeypoints = fistCenter;

    return {
      landmarks,
      fistCenter,
      punchEvent,
      allHands: results.landmarks,
    };
  }

  reset() {
    this._prevKeypoints = null;
    this._cooldownLeft = 0;
  }

  async destroy() {
    if (this._handLandmarker) {
      this._handLandmarker.close();
    }
  }
}
