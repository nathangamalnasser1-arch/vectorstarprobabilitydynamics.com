import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Recorder } from '../lib/recorder.js';

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    MockMediaRecorder.lastInstance = this;
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }
  static isTypeSupported(type) {
    return type === 'video/webm';
  }
}

global.MediaRecorder = MockMediaRecorder;

// Mock canvas
function makeMockCanvas() {
  const canvas = {
    captureStream: vi.fn(() => ({ getTracks: vi.fn(() => []) })),
    toBlob: vi.fn((cb, type, quality) => {
      cb(new Blob(['fake-image'], { type: 'image/jpeg' }));
    }),
    width: 640,
    height: 480,
  };
  return canvas;
}

// Mock URL and anchor click
global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
global.URL.revokeObjectURL = vi.fn();
document.createElement = vi.fn((tag) => {
  if (tag === 'a') {
    return { href: '', download: '', click: vi.fn() };
  }
  return {};
});

describe('Recorder', () => {
  let recorder;
  let canvas;

  beforeEach(() => {
    recorder = new Recorder();
    canvas = makeMockCanvas();
    vi.clearAllMocks();
  });

  it('starts with isRecording = false', () => {
    expect(recorder.isRecording).toBe(false);
  });

  it('starts recording and sets isRecording = true', () => {
    recorder.start(canvas, 30);
    expect(recorder.isRecording).toBe(true);
    expect(canvas.captureStream).toHaveBeenCalledWith(30);
  });

  it('does not start again if already recording', () => {
    recorder.start(canvas, 30);
    recorder.start(canvas, 30);
    expect(canvas.captureStream).toHaveBeenCalledTimes(1);
  });

  it('stop() resolves to a Blob', async () => {
    recorder.start(canvas, 30);
    const blob = await recorder.stop();
    expect(blob).toBeInstanceOf(Blob);
    expect(recorder.isRecording).toBe(false);
  });

  it('stop() resolves to null if not recording', async () => {
    const blob = await recorder.stop();
    expect(blob).toBeNull();
  });

  it('saveToDevice creates an anchor and clicks it', () => {
    const blob = new Blob(['test'], { type: 'video/webm' });
    recorder.saveToDevice(blob, 'test.webm');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('capturePhoto calls canvas.toBlob', () => {
    recorder.capturePhoto(canvas, 'test.jpg');
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
  });

  it('uses webm mime type by default', () => {
    recorder.start(canvas, 30);
    expect(MockMediaRecorder.lastInstance.options.mimeType).toBe('video/webm');
  });
});
