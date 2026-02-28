(function () {
  'use strict';

  // Image comparison slider
  function initImageSlider() {
    var clip = document.getElementById('comp-clip');
    var track = document.getElementById('comp-track');
    var input = document.getElementById('comp-input');
    if (!clip || !track) return;
    var pct = 50;

    function setPct(value) {
      pct = Math.max(0, Math.min(100, value));
      clip.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      track.style.left = pct + '%';
      if (input) input.value = pct;
      track.setAttribute('aria-valuenow', Math.round(pct));
    }

    if (input) input.addEventListener('input', function () { setPct(Number(input.value)); });

    track.addEventListener('mousedown', function (e) {
      e.preventDefault();
      function move(ev) {
        var rect = track.parentElement.getBoundingClientRect();
        setPct(((ev.clientX - rect.left) / rect.width) * 100);
      }
      function up() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      move(e);
    });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') setPct(pct - 5);
      else if (e.key === 'ArrowRight') setPct(pct + 5);
    });
  }

  // Spectrum chart (Sirius B redshift)
  var BALMER = [656.3, 486.1, 434.0, 410.2];
  var REDSHIFT_BASE = 0.00008 * 250;

  function initSpectrum() {
    var slider = document.getElementById('spectrum-slider');
    var display = document.getElementById('spectrum-display');
    var stdMarkers = document.getElementById('spectrum-std');
    var sbMarkers = document.getElementById('spectrum-sb');
    if (!slider || !stdMarkers || !sbMarkers) return;

    function scale(w) { return ((w - 400) / 300) * 100; }
    function clampX(x) { return Math.max(0, Math.min(100 - 1.8, x - 0.9)); }

    function update() {
      var g = Number(slider.value);
      if (display) display.textContent = g.toFixed(1) + '×';
      var z = REDSHIFT_BASE * g;
      var sb = BALMER.map(function (w) { return w * (1 + z); });

      stdMarkers.innerHTML = BALMER.map(function (w) {
        var x = clampX(scale(w));
        return '<rect x="' + x + '" y="44" width="1.8" height="8" fill="#6366f1" opacity="0.9"/>';
      }).join('');

      sbMarkers.innerHTML = sb.map(function (w) {
        var x = clampX(scale(w));
        return '<rect x="' + x + '" y="59" width="1.8" height="8" fill="#3b82f6" opacity="0.9"/>';
      }).join('');
    }

    slider.addEventListener('input', update);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initImageSlider();
      initSpectrum();
    });
  } else {
    initImageSlider();
    initSpectrum();
  }
})();
