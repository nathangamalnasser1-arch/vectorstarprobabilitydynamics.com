/**
 * ApplicationModule: Hadronic spectral analysis. Renders simulated GeV-energy
 * photon spectrum with logarithmic Y-axis and inverse slope (T_eff) display.
 */

(function (global) {
  'use strict';

  let lastResult = null;
  const instances = [];

  const E_MIN = 0.1;
  const E_MAX = 1.0;
  const MARGIN = { top: 32, right: 24, bottom: 40, left: 52 };
  const COLORS = {
    baseline: 'rgba(80, 140, 220, 0.9)',
    fill: 'rgba(80, 140, 220, 0.25)',
    grid: 'rgba(255, 255, 255, 0.08)',
    text: 'rgba(240, 240, 245, 0.95)',
    inverseSlope: 'rgba(220, 180, 80, 0.95)',
  };

  function setResult(result) {
    lastResult = result;
  }

  function getResult() {
    return lastResult;
  }

  function renderTo(canvas, ctx) {
    if (!canvas || !ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const plotLeft = MARGIN.left;
    const plotRight = width - MARGIN.right;
    const plotTop = MARGIN.top;
    const plotBottom = height - MARGIN.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    ctx.fillStyle = 'rgba(15, 18, 28, 0.9)';
    ctx.fillRect(0, 0, width, height);

    if (!lastResult || !lastResult.binCenters || !lastResult.spectrum) {
      ctx.fillStyle = COLORS.text;
      ctx.font = '14px Inter, Roboto, sans-serif';
      ctx.fillText('Adjust Δt / measurement window to generate spectrum', plotLeft, plotTop + 20);
      return;
    }

    const { binCenters, spectrum, T_eff, slope } = lastResult;
    const logEMin = Math.log(E_MIN);
    const logEMax = Math.log(E_MAX);
    const ys = spectrum.map(y => Math.max(y, 1e-12));
    const logYMin = Math.log(Math.min(...ys));
    const logYMax = Math.log(Math.max(...ys) || 1);
    const logYRange = logYMax - logYMin || 1;

    function xToPx(e) {
      const logE = Math.log(Math.max(e, 0.01));
      return plotLeft + ((logE - logEMin) / (logEMax - logEMin)) * plotWidth;
    }
    function yToPx(logY) {
      return plotBottom - ((logY - logYMin) / logYRange) * plotHeight;
    }

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
      const e = E_MIN * Math.pow(E_MAX / E_MIN, i / 4);
      const px = xToPx(e);
      ctx.beginPath();
      ctx.moveTo(px, plotTop);
      ctx.lineTo(px, plotBottom);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const logY = logYMin + (logYRange * i) / 4;
      const py = yToPx(logY);
      ctx.beginPath();
      ctx.moveTo(plotLeft, py);
      ctx.lineTo(plotRight, py);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.fill;
    ctx.strokeStyle = COLORS.baseline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < binCenters.length; i++) {
      const e = binCenters[i];
      const y = Math.max(ys[i], 1e-12);
      const logY = Math.log(y);
      const px = xToPx(e);
      const py = yToPx(logY);
      if (!started) {
        ctx.moveTo(px, plotBottom);
        started = true;
      }
      ctx.lineTo(px, py);
    }
    ctx.lineTo(xToPx(binCenters[binCenters.length - 1]), plotBottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = '11px Inter, Roboto, sans-serif';
    ctx.fillText('E (GeV)', (plotLeft + plotRight) / 2 - 24, height - 8);
    ctx.save();
    ctx.translate(14, (plotTop + plotBottom) / 2 + 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('dN/dE (log)', 0, 0);
    ctx.restore();

    ctx.fillStyle = COLORS.inverseSlope;
    ctx.font = '12px Inter, Roboto, sans-serif';
    ctx.fillText(`T_eff ≈ ${(T_eff != null ? T_eff : 0).toFixed(3)} GeV`, plotRight - 120, plotTop - 8);
  }

  function render() {
    instances.forEach(function (inst) {
      if (inst.canvas && inst.ctx) renderTo(inst.canvas, inst.ctx);
    });
  }

  function init(containerEl, getResultFn) {
    if (!containerEl) return null;
    if (getResultFn) setResult(getResultFn());
    const canvas = document.createElement('canvas');
    canvas.width = containerEl.clientWidth || 560;
    canvas.height = containerEl.clientHeight || 320;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const ctx = canvas.getContext('2d');
    containerEl.appendChild(canvas);
    instances.push({ canvas, ctx });

    const resizeObserver = new ResizeObserver(() => {
      if (!containerEl.contains(canvas)) return;
      const w = containerEl.clientWidth;
      const h = containerEl.clientHeight;
      if (w && h) {
        canvas.width = w;
        canvas.height = h;
        renderTo(canvas, ctx);
      }
    });
    resizeObserver.observe(containerEl);
    renderTo(canvas, ctx);
    return { canvas, ctx };
  }

  function update(result) {
    setResult(result);
    render();
  }

  const ApplicationModule = {
    init,
    render,
    update,
    setResult,
    getResult,
    E_MIN,
    E_MAX,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApplicationModule;
  } else {
    global.ApplicationModule = ApplicationModule;
  }
})(typeof window !== 'undefined' ? window : this);
