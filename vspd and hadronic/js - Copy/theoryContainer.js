/**
 * TheoryContainer: Vector-Star visualization. Red micro-path vectors;
 * density scales with Δt to show emergence of superposition from duration.
 * requestAnimationFrame rendering loop.
 */

(function (global) {
  'use strict';

  let canvas;
  let ctx;
  let animId;
  let getStateFn = () => ({});

  function setStateGetter(fn) {
    getStateFn = fn;
  }

  function renderVectorStar() {
    if (!canvas || !ctx) return;
    const state = getStateFn();
    const deltaTNorm = state.deltaTNorm ?? 0.5;
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    ctx.fillStyle = 'rgba(15, 18, 28, 0.85)';
    ctx.fillRect(0, 0, width, height);

    const n = Math.max(12, Math.min(400, Math.round(80 * (0.5 + deltaTNorm))));
    const microPaths = [];
    for (let i = 0; i < n; i++) {
      const theta = (2 * Math.PI * i) / n + (Date.now() * 0.0003);
      const len = radius * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(theta * 2)));
      microPaths.push({ theta, len });
    }

    ctx.strokeStyle = 'rgba(200, 60, 60, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (const p of microPaths) {
      const len = p.len;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + len * Math.cos(p.theta), cy - len * Math.sin(p.theta));
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function tick() {
    renderVectorStar();
    animId = requestAnimationFrame(tick);
  }

  function init(containerEl, getState) {
    if (!containerEl) return null;
    setStateGetter(getState);
    canvas = document.createElement('canvas');
    canvas.width = containerEl.clientWidth || 640;
    canvas.height = containerEl.clientHeight || 400;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx = canvas.getContext('2d');
    containerEl.appendChild(canvas);

    const resizeObserver = new ResizeObserver(() => {
      if (!containerEl.contains(canvas)) return;
      const w = containerEl.clientWidth;
      const h = containerEl.clientHeight;
      if (w && h) {
        canvas.width = w;
        canvas.height = h;
      }
    });
    resizeObserver.observe(containerEl);

    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(tick);
    return { canvas, ctx, stop: () => { if (animId) cancelAnimationFrame(animId); } };
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  const TheoryContainer = {
    init,
    stop,
    setStateGetter,
    renderVectorStar,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TheoryContainer;
  } else {
    global.TheoryContainer = TheoryContainer;
  }
})(typeof window !== 'undefined' ? window : this);
