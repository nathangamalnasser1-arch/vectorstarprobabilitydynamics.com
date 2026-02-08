/**
 * experiment.js — Deterministic visualization of CMS muon events.
 * - Loads data/cms-muon-events.json
 * - Renders by event_index: Standard (scalar probability) or VSPD (vector field)
 * - All rendering is deterministic: same data + event_index => same frame
 */

(function () {
  'use strict';

  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var eventSlider = document.getElementById('eventSlider');
  var eventLabel = document.getElementById('eventLabel');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');
  var chkPlay = document.getElementById('chkPlay');
  var modeRadios = document.querySelectorAll('input[name="mode"]');

  // --- State (reproducible from event index and mode) ---
  var events = [];           // list of { event_index, particles: [...] }
  var eventIndex = 0;
  var maxEventIndex = 0;
  var mode = 'standard';     // 'standard' | 'vspd'
  var playInterval = null;

  // --- Coordinate mapping: data (x,y) in [-3,3] -> canvas pixels ---
  var padding = 40;
  var dataMin = -3;
  var dataMax = 3;

  function dataToCanvas(x, y) {
    var w = canvas.width;
    var h = canvas.height;
    var range = dataMax - dataMin;
    var scaleX = (w - 2 * padding) / range;
    var scaleY = (h - 2 * padding) / range;
    return {
      px: padding + (x - dataMin) * scaleX,
      py: h - padding - (y - dataMin) * scaleY
    };
  }

  function getParticlesAtEvent(idx) {
    for (var i = 0; i < events.length; i++) {
      if (events[i].event_index === idx) return events[i].particles;
    }
    return [];
  }

  /**
   * Scalar probability proxy: from energy and local count.
   * Normalized so we can map to radius and brightness (deterministic).
   */
  function scalarProbability(particle, allAtEvent) {
    var e = Math.max(0.1, particle.energy);
    var norm = 3; // typical scale
    var rho = e / norm;
    return Math.min(1, rho);
  }

  /**
   * Vector at (x,y): from momentum field (average px, py in neighborhood).
   * Used for VSPD arrows. Deterministic.
   */
  function getVectorAt(gridX, gridY, particles, cellHalf) {
    if (!particles.length) return { vx: 0, vy: 0, mag: 0 };
    cellHalf = cellHalf || 0.5;
    var vx = 0, vy = 0, count = 0;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (Math.abs(p.x - gridX) <= cellHalf && Math.abs(p.y - gridY) <= cellHalf) {
        vx += p.px;
        vy += p.py;
        count++;
      }
    }
    if (count === 0) return { vx: 0, vy: 0, mag: 0 };
    vx /= count;
    vy /= count;
    var mag = Math.sqrt(vx * vx + vy * vy) || 1e-6;
    return { vx: vx, vy: vy, mag: mag };
  }

  /**
   * Draw one frame. Deterministic: only eventIndex and mode matter.
   */
  function render() {
    var w = canvas.width;
    var h = canvas.height;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    var particles = getParticlesAtEvent(eventIndex);
    if (particles.length === 0) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No particles at this event index', w / 2, h / 2);
      return;
    }

    if (mode === 'standard') {
      // --- Standard: scalar probability as radius and brightness ---
      var maxE = 0;
      for (var i = 0; i < particles.length; i++) {
        if (particles[i].energy > maxE) maxE = particles[i].energy;
      }
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        var rho = scalarProbability(p, particles);
        var pt = dataToCanvas(p.x, p.y);
        var radius = 4 + 12 * rho;
        var g = Math.floor(80 + 160 * rho);
        ctx.fillStyle = 'rgb(' + g + ',' + g + ',255)';
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // --- VSPD: vector field (arrows) + particle positions (small dots) ---
      var gridStep = 0.8;
      var arrowScale = 8;
      for (var gx = dataMin; gx <= dataMax; gx += gridStep) {
        for (var gy = dataMin; gy <= dataMax; gy += gridStep) {
          var vec = getVectorAt(gx, gy, particles, gridStep * 0.6);
          if (vec.mag < 0.05) continue;
          var c = dataToCanvas(gx, gy);
          var dx = vec.vx / vec.mag * arrowScale;
          var dy = -vec.vy / vec.mag * arrowScale;
          var scale = Math.min(1, vec.mag * 0.4);
          dx *= scale;
          dy *= scale;
          ctx.strokeStyle = 'rgba(88, 166, 255, ' + (0.4 + 0.5 * scale) + ')';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(c.px, c.py);
          ctx.lineTo(c.px + dx, c.py + dy);
          ctx.stroke();
          var ax = c.px + dx;
          var ay = c.py + dy;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - 4, ay + 3);
          ctx.lineTo(ax - 2, ay);
          ctx.lineTo(ax - 4, ay - 3);
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }
      for (var k = 0; k < particles.length; k++) {
        var p2 = particles[k];
        var pt2 = dataToCanvas(p2.x, p2.y);
        ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
        ctx.beginPath();
        ctx.arc(pt2.px, pt2.py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#8b949e';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('event_index = ' + eventIndex + '  |  particles = ' + particles.length, padding, h - 10);
  }

  function setEventIndex(idx) {
    eventIndex = Math.max(0, Math.min(maxEventIndex, idx));
    if (eventSlider) {
      eventSlider.value = eventIndex;
    }
    if (eventLabel) {
      eventLabel.textContent = 'event ' + eventIndex;
    }
    render();
  }

  function getMode() {
    var r = document.querySelector('input[name="mode"]:checked');
    return r ? r.value : 'standard';
  }

  function onModeChange() {
    mode = getMode();
    render();
  }

  function stepNext() {
    if (eventIndex < maxEventIndex) setEventIndex(eventIndex + 1);
  }

  function stepPrev() {
    if (eventIndex > 0) setEventIndex(eventIndex - 1);
  }

  function startPlay() {
    if (playInterval) return;
    playInterval = setInterval(function () {
      stepNext();
      if (eventIndex >= maxEventIndex) {
        clearInterval(playInterval);
        playInterval = null;
        if (chkPlay) chkPlay.checked = false;
      }
    }, 600);
  }

  function stopPlay() {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  function resizeCanvas() {
    var container = canvas.parentElement;
    if (!container) return;
    var rect = container.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.floor(rect.width * dpr);
    var h = Math.floor((rect.width * 10 / 16) * dpr);
    if (rect.height && !isNaN(rect.height)) {
      h = Math.floor(rect.height * dpr);
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      render();
    }
  }

  // --- Load data ---
  function loadData(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/cms-muon-events.json', true);
    xhr.onload = function () {
      if (xhr.status !== 200) {
        console.warn('Could not load data, using empty set.');
        events = [];
        maxEventIndex = 0;
        callback();
        return;
      }
      try {
        var raw = JSON.parse(xhr.responseText);
        var byEvent = {};
        for (var i = 0; i < raw.length; i++) {
          var ei = raw[i].event_index;
          if (!byEvent[ei]) byEvent[ei] = [];
          byEvent[ei].push(raw[i]);
        }
        events = [];
        var keys = Object.keys(byEvent).map(Number).sort(function (a, b) { return a - b; });
        for (var k = 0; k < keys.length; k++) {
          events.push({ event_index: keys[k], particles: byEvent[keys[k]] });
        }
        maxEventIndex = keys.length ? keys[keys.length - 1] : 0;
      } catch (e) {
        console.warn('Parse error', e);
        events = [];
        maxEventIndex = 0;
      }
      callback();
    };
    xhr.onerror = function () {
      events = [];
      maxEventIndex = 0;
      callback();
    };
    xhr.send();
  }

  loadData(function () {
    if (eventSlider) {
      eventSlider.max = maxEventIndex;
      eventSlider.value = 0;
    }
    setEventIndex(0);
  });

  if (eventSlider) eventSlider.addEventListener('input', function () { setEventIndex(parseInt(eventSlider.value, 10)); });
  if (btnPrev) btnPrev.addEventListener('click', stepPrev);
  if (btnNext) btnNext.addEventListener('click', stepNext);
  if (chkPlay) chkPlay.addEventListener('change', function () { chkPlay.checked ? startPlay() : stopPlay(); });
  modeRadios.forEach(function (r) { r.addEventListener('change', onModeChange); });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
})();
