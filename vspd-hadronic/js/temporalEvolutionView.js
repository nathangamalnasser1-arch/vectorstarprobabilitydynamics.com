/**
 * Temporal evolution graph with yellow shaded measurement window overlay.
 * User can drag window edges to adjust Δt; triggers live re-calculation.
 */

(function (global) {
  'use strict';

  let canvas;
  let ctx;
  let getStateFn = () => ({});
  let onWindowChange = null;
  let dragging = null;
  const MARGIN = { top: 20, right: 16, bottom: 28, left: 44 };
  const WINDOW_OPACITY = 0.3;
  const HANDLE_WIDTH = 8;
  const COLORS = { text: 'rgba(240,240,245,0.9)' };

  function setStateGetter(fn) {
    getStateFn = fn;
  }

  function setOnWindowChange(fn) {
    onWindowChange = fn;
  }

  function getPlotRect() {
    if (!canvas) return null;
    const width = canvas.width;
    const height = canvas.height;
    return {
      left: MARGIN.left,
      right: width - MARGIN.right,
      top: MARGIN.top,
      bottom: height - MARGIN.bottom,
      width: width - MARGIN.left - MARGIN.right,
      height: height - MARGIN.top - MARGIN.bottom,
    };
  }

  function normToPx(norm, rect) {
    return rect.left + norm * rect.width;
  }

  function pxToNorm(px, rect) {
    return (px - rect.left) / rect.width;
  }

  function render() {
    if (!canvas || !ctx) return;
    const state = getStateFn();
    const { flowProfile, tStart, tEnd, tMin, tMax } = state;
    const rect = getPlotRect();
    if (!rect) return;

    ctx.fillStyle = 'rgba(12, 14, 22, 0.92)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const profile = flowProfile || [];
    const tMinVal = tMin ?? 0;
    const tMaxVal = tMax ?? 10;
    const span = tMaxVal - tMinVal || 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < profile.length; i++) {
      const p = profile[i];
      const x = rect.left + ((p.t - tMinVal) / span) * rect.width;
      const y = rect.bottom - (p.T / 0.4) * rect.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const normStart = ((tStart ?? 0) - tMinVal) / span;
    const normEnd = ((tEnd ?? 1) - tMinVal) / span;
    const xStart = normToPx(normStart, rect);
    const xEnd = normToPx(normEnd, rect);

    ctx.fillStyle = `rgba(255, 220, 100, ${WINDOW_OPACITY})`;
    ctx.fillRect(xStart, rect.top, xEnd - xStart, rect.height);

    ctx.strokeStyle = 'rgba(255, 220, 100, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(xStart, rect.top, xEnd - xStart, rect.height);

    ctx.fillStyle = COLORS.text;
    ctx.font = '11px Inter, Roboto, sans-serif';
    ctx.fillText('t (a.u.)', (rect.left + rect.right) / 2 - 18, canvas.height - 6);
  }

  function handlePointerDown(e) {
    const rect = getPlotRect();
    if (!rect) return;
    const state = getStateFn();
    const tMinVal = state.tMin ?? 0;
    const tMaxVal = state.tMax ?? 10;
    const span = tMaxVal - tMinVal || 1;
    const tStart = state.tStart ?? 0;
    const tEnd = state.tEnd ?? 1;
    const normStart = (tStart - tMinVal) / span;
    const normEnd = (tEnd - tMinVal) / span;
    const xStart = normToPx(normStart, rect);
    const xEnd = normToPx(normEnd, rect);
    const px = e.offsetX ?? e.clientX - canvas.getBoundingClientRect().left;

    if (Math.abs(px - xStart) <= HANDLE_WIDTH && e.target === canvas) {
      dragging = 'left';
      e.preventDefault();
    } else if (Math.abs(px - xEnd) <= HANDLE_WIDTH && e.target === canvas) {
      dragging = 'right';
      e.preventDefault();
    }
  }

  function handlePointerMove(e) {
    const rect = getPlotRect();
    if (!rect || !dragging) return;
    const px = e.offsetX ?? e.clientX - canvas.getBoundingClientRect().left;
    const norm = pxToNorm(px, rect);
    const state = getStateFn();
    const tMinVal = state.tMin ?? 0;
    const tMaxVal = state.tMax ?? 10;
    const span = tMaxVal - tMinVal || 1;
    let normStart = (state.tStart - tMinVal) / span;
    let normEnd = (state.tEnd - tMinVal) / span;

    if (dragging === 'left') {
      normStart = Math.max(0, Math.min(normEnd - 0.02, norm));
    } else {
      normEnd = Math.min(1, Math.max(normStart + 0.02, norm));
    }
    const tStart = tMinVal + normStart * span;
    const tEnd = tMinVal + normEnd * span;
    if (typeof onWindowChange === 'function') {
      onWindowChange(normStart, normEnd);
    }
    e.preventDefault();
  }

  function handlePointerUp() {
    dragging = null;
  }

  function init(containerEl, getState, onWindowChangeCb) {
    if (!containerEl) return null;
    setStateGetter(getState);
    onWindowChange = onWindowChangeCb;
    canvas = document.createElement('canvas');
    canvas.width = containerEl.clientWidth || 400;
    canvas.height = 140;
    canvas.style.display = 'block';
    canvas.style.cursor = 'ew-resize';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx = canvas.getContext('2d');
    containerEl.appendChild(canvas);

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const resizeObserver = new ResizeObserver(() => {
      if (!containerEl.contains(canvas)) return;
      const w = containerEl.clientWidth;
      const h = containerEl.clientHeight;
      if (w && h) {
        canvas.width = w;
        canvas.height = h;
        render();
      }
    });
    resizeObserver.observe(containerEl);
    render();
    return { canvas, ctx, render };
  }

  const TemporalEvolutionView = {
    init,
    render,
    setStateGetter,
    setOnWindowChange,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemporalEvolutionView;
  } else {
    global.TemporalEvolutionView = TemporalEvolutionView;
  }
})(typeof window !== 'undefined' ? window : this);
