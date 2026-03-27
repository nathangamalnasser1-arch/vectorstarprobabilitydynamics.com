/**
 * BubbleDetector — OpenCV.js-based bubble detection
 *
 * Strategy:
 *  1. Background subtraction to isolate moving circular objects
 *  2. Hough Circle Transform to find bubbles in each frame
 *  3. Track each bubble centroid across frames via nearest-neighbor matching
 *  4. When a tracked bubble disappears → register as a pop
 *
 * Requires OpenCV.js to be loaded globally (via CDN in index.html).
 */

export class BubbleDetector {
  constructor(options = {}) {
    this.minRadius = options.minRadius ?? 15;
    this.maxRadius = options.maxRadius ?? 80;
    this.matchDistanceThreshold = options.matchDistanceThreshold ?? 60;
    this.disappearFrameThreshold = options.disappearFrameThreshold ?? 3;
    this.onPop = options.onPop ?? (() => {});

    this._trackedBubbles = new Map(); // id → { cx, cy, missedFrames }
    this._nextId = 0;
    this._popCount = 0;
    this._backgroundSubtractor = null;
    this._isReady = false;
  }

  /** Call once after OpenCV.js is ready */
  init() {
    if (typeof cv === 'undefined') {
      console.warn('BubbleDetector: OpenCV.js not loaded yet');
      return false;
    }
    // MOG2 background subtractor — handles moving fighter well
    this._backgroundSubtractor = new cv.BackgroundSubtractorMOG2(500, 16, false);
    this._isReady = true;
    return true;
  }

  /** Process a single video frame (ImageData or HTMLVideoElement) */
  processFrame(source) {
    if (!this._isReady) return { bubbles: [], popCount: this._popCount };

    const src = cv.imread(source);
    const fg = new cv.Mat();
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const circles = new cv.Mat();

    try {
      // Apply background subtraction
      this._backgroundSubtractor.apply(src, fg);

      // Convert to gray and blur to reduce noise
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 2, 2);

      // Hough Circle Transform
      cv.HoughCircles(
        blurred,
        circles,
        cv.HOUGH_GRADIENT,
        1,         // dp (inverse ratio of resolution)
        30,        // minDist between circle centers
        50,        // param1: upper Canny threshold
        30,        // param2: accumulator threshold
        this.minRadius,
        this.maxRadius
      );

      const detectedThisFrame = [];
      for (let i = 0; i < circles.cols; i++) {
        const cx = circles.data32F[i * 3];
        const cy = circles.data32F[i * 3 + 1];
        const r = circles.data32F[i * 3 + 2];
        detectedThisFrame.push({ cx, cy, r });
      }

      this._updateTracking(detectedThisFrame);

      return { bubbles: detectedThisFrame, popCount: this._popCount };
    } finally {
      src.delete();
      fg.delete();
      gray.delete();
      blurred.delete();
      circles.delete();
    }
  }

  _updateTracking(detectedBubbles) {
    const matched = new Set();

    // Match detected bubbles to existing tracked bubbles (nearest centroid)
    for (const [id, tracked] of this._trackedBubbles) {
      let bestDist = Infinity;
      let bestIdx = -1;

      detectedBubbles.forEach((b, idx) => {
        if (matched.has(idx)) return;
        const dist = Math.hypot(b.cx - tracked.cx, b.cy - tracked.cy);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      if (bestIdx >= 0 && bestDist < this.matchDistanceThreshold) {
        // Bubble still visible — update position, reset missed counter
        const b = detectedBubbles[bestIdx];
        this._trackedBubbles.set(id, { cx: b.cx, cy: b.cy, missedFrames: 0 });
        matched.add(bestIdx);
      } else {
        // Bubble not found this frame
        tracked.missedFrames += 1;
        if (tracked.missedFrames >= this.disappearFrameThreshold) {
          // Bubble has disappeared → pop!
          this._trackedBubbles.delete(id);
          this._popCount += 1;
          this.onPop(this._popCount);
        }
      }
    }

    // Register new bubbles that weren't matched
    detectedBubbles.forEach((b, idx) => {
      if (!matched.has(idx)) {
        this._trackedBubbles.set(this._nextId++, { cx: b.cx, cy: b.cy, missedFrames: 0 });
      }
    });
  }

  reset() {
    this._trackedBubbles.clear();
    this._nextId = 0;
    this._popCount = 0;
    if (this._backgroundSubtractor) {
      this._backgroundSubtractor.delete();
      this._backgroundSubtractor = new cv.BackgroundSubtractorMOG2(500, 16, false);
    }
  }

  get popCount() {
    return this._popCount;
  }

  destroy() {
    if (this._backgroundSubtractor) {
      this._backgroundSubtractor.delete();
    }
  }
}
