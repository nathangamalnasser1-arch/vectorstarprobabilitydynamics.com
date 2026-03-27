/**
 * Recorder — wraps MediaRecorder API to capture the composited canvas stream.
 *
 * Records the canvas that overlays the camera feed + ring light + UI elements,
 * giving a complete video of the session.
 */

export class Recorder {
  constructor() {
    this._mediaRecorder = null;
    this._chunks = [];
    this._stream = null;
    this.isRecording = false;
  }

  /**
   * Start recording from a canvas element.
   * @param {HTMLCanvasElement} canvas - the composited canvas
   * @param {number} fps
   */
  start(canvas, fps = 30) {
    if (this.isRecording) return;

    this._chunks = [];
    this._stream = canvas.captureStream(fps);

    const mimeType = this._getSupportedMime();
    this._mediaRecorder = new MediaRecorder(this._stream, { mimeType });

    this._mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this._chunks.push(e.data);
    };

    this._mediaRecorder.start(100); // collect in 100ms chunks
    this.isRecording = true;
  }

  /**
   * Stop recording and return a Blob.
   * @returns {Promise<Blob>}
   */
  stop() {
    return new Promise((resolve) => {
      if (!this._mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this._mediaRecorder.onstop = () => {
        const mimeType = this._getSupportedMime();
        const blob = new Blob(this._chunks, { type: mimeType });
        this._chunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      this._mediaRecorder.stop();
    });
  }

  /**
   * Save a Blob to the user's device.
   * @param {Blob} blob
   * @param {string} filename
   */
  saveToDevice(blob, filename = 'bubbleboxing-session.webm') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /**
   * Capture a single JPEG frame from the current canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {string} filename
   */
  capturePhoto(canvas, filename = 'bubbleboxing-photo.jpg') {
    canvas.toBlob(
      (blob) => {
        this.saveToDevice(blob, filename);
      },
      'image/jpeg',
      0.92
    );
  }

  _getSupportedMime() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  }
}
