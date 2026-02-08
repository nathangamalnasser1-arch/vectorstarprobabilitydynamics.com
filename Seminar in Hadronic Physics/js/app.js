/**
 * Main app: D3 spectrum, expansion animation, dual-track UI, validation.
 * Four-phase: Assessment (layout), Identification (mapping), Pilot (prototype), Integration (sliders → u^μ).
 */

(function () {
  'use strict';

  var pT_GeV = [0.3, 0.5, 0.7, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0, 3.5, 4.0];
  var T_local = 250;
  var v_transverse = 0;
  var spectrumMode = 'effective';

  var margin = { top: 20, right: 30, bottom: 40, left: 50 };
  var width = 0;
  var height = 320;
  var svgSpectrum = null;
  var xScale = null;
  var yScale = null;

  function getSpectrum() {
    var stored = DataPipeline.runPipeline(null, null, T_local, v_transverse / 100);
    return stored.spectrum.length ? stored.spectrum : PhysicsEngine.computeSpectrum(T_local, v_transverse / 100, pT_GeV);
  }

  function renderSpectrum() {
    var container = document.getElementById('spectrum-chart');
    if (!container) return;
    width = container.clientWidth || 800;
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    var spectrum = getSpectrum();
    var key = spectrumMode === 'effective' ? 'yield_effective' : 'yield_local';
    var yExtent = d3.extent(spectrum, function (d) { return d[key]; });
    yExtent[0] = Math.max(1e-4, yExtent[0] * 0.5);
    yExtent[1] = Math.min(50, yExtent[1] * 1.2);

    if (!svgSpectrum) {
      svgSpectrum = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
      var g = svgSpectrum.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      g.append('g').attr('class', 'x-axis');
      g.append('g').attr('class', 'y-axis');
      g.append('path').attr('class', 'spectrum-line');
      g.append('path').attr('class', 'slope-line');
      g.append('g').attr('class', 'spectrum-dots');
    }

    xScale = d3.scaleLinear()
      .domain(d3.extent(spectrum, function (d) { return d.p_T; }))
      .range([0, innerWidth]);
    yScale = d3.scaleLog()
      .domain(yExtent)
      .range([innerHeight, 0]);

    var line = d3.line()
      .x(function (d) { return xScale(d.p_T); })
      .y(function (d) { return yScale(d[key]); })
      .curve(d3.curveMonotoneX);

    var g = svgSpectrum.select('g');
    g.select('.x-axis').call(d3.axisBottom(xScale).ticks(6)).attr('transform', 'translate(0,' + innerHeight + ')');
    g.select('.y-axis').call(d3.axisLeft(yScale).ticks(6));
    if (g.select('.x-label').empty()) {
      g.append('text').attr('class', 'x-label').attr('fill', '#8b949e').attr('font-size', '11px')
        .attr('text-anchor', 'middle').text('p_T (GeV)');
      g.append('text').attr('class', 'y-label').attr('fill', '#8b949e').attr('font-size', '11px')
        .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').text('Yield');
    }
    g.select('.x-label').attr('x', innerWidth / 2).attr('y', innerHeight + 32);
    g.select('.y-label').attr('x', -innerHeight / 2).attr('y', -42);
    g.select('.spectrum-line')
      .datum(spectrum)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#f0883e')
      .attr('stroke-width', 2);
    g.select('.spectrum-dots')
      .selectAll('circle')
      .data(spectrum)
      .join('circle')
      .attr('cx', function (d) { return xScale(d.p_T); })
      .attr('cy', function (d) { return yScale(d[key]); })
      .attr('r', 4)
      .attr('fill', '#f0883e');

    var invSlope = PhysicsEngine.inverseSlopeFromSpectrum(spectrum, spectrumMode === 'effective');
    var slopeLineData = [];
    if (invSlope.slope !== 0 && invSlope.T_eff_MeV > 0) {
      var pMin = spectrum[0].p_T;
      var pMax = spectrum[spectrum.length - 1].p_T;
      var lnY0 = invSlope.slope * pMin + invSlope.intercept;
      var lnY1 = invSlope.slope * pMax + invSlope.intercept;
      slopeLineData = [
        { p_T: pMin, lnY: lnY0 },
        { p_T: pMax, lnY: lnY1 }
      ];
    }
    var slopeLine = d3.line()
      .x(function (d) { return xScale(d.p_T); })
      .y(function (d) { return yScale(Math.exp(d.lnY)); })
      .curve(d3.curveLinear);
    g.select('.slope-line')
      .datum(slopeLineData)
      .attr('d', slopeLine)
      .attr('fill', 'none')
      .attr('stroke', '#58a6ff')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    var disp = document.getElementById('inverse-slope-display');
    if (disp) {
      disp.textContent = 'Inverse slope → T_eff ≈ ' + (invSlope.T_eff_MeV ? invSlope.T_eff_MeV.toFixed(0) : '—') + ' MeV';
    }
  }

  function renderExpansion() {
    var container = document.getElementById('expansion-viz');
    if (!container) return;
    var w = container.clientWidth || 800;
    var h = 200;
    var v = v_transverse / 100;

    d3.select(container).selectAll('*').remove();
    var svg = d3.select(container)
      .append('svg')
      .attr('width', w)
      .attr('height', h);

    var centerX = w / 2;
    var centerY = h / 2;
    var baseR = 40;
    var flowR = baseR + v * 80;

    var gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'flowGrad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#3fb950');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#f0883e');

    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', baseR)
      .attr('fill', 'none')
      .attr('stroke', '#30363d')
      .attr('stroke-width', 2);
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', flowR)
      .attr('fill', 'none')
      .attr('stroke', 'url(#flowGrad)')
      .attr('stroke-width', 3)
      .attr('opacity', 0.8);
    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY - flowR - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', '12px')
      .text('Transverse expansion u^μ (v = ' + v.toFixed(2) + ')');
  }

  function runValidation() {
    var vSamples = [0, 0.2, 0.4, 0.6, 0.8];
    var T_effSamples = vSamples.map(function (v) {
      return PhysicsEngine.effectiveTemperature(T_local, v);
    });
    var result = Validation.validateExpansionVsEffectiveTemp(vSamples, T_effSamples);
    var badge = document.getElementById('validation-badge');
    if (badge) {
      badge.textContent = result.valid
        ? 'Causal check: v → T_eff consistent (R² ≈ ' + result.r2.toFixed(2) + ')'
        : 'Check: ' + result.reason;
      badge.className = 'validation-badge ' + (result.valid ? 'valid' : 'invalid');
    }
  }

  function setTrack(track) {
    document.querySelectorAll('.track-tabs button').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-track') === track);
      btn.setAttribute('aria-pressed', btn.getAttribute('data-track') === track ? 'true' : 'false');
    });
    document.getElementById('explanation-beginner').classList.toggle('hidden', track !== 'beginner');
    document.getElementById('explanation-expert').classList.toggle('hidden', track !== 'expert');
  }

  function init() {
    document.querySelectorAll('.track-tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTrack(btn.getAttribute('data-track'));
      });
    });

    var tLocalInput = document.getElementById('T-local');
    var vInput = document.getElementById('v-transverse');
    var modeSelect = document.getElementById('spectrum-mode');

    if (tLocalInput) {
      tLocalInput.addEventListener('input', function () {
        T_local = Number(tLocalInput.value);
        document.getElementById('T-local-value').textContent = T_local;
        renderSpectrum();
        renderExpansion();
        runValidation();
      });
    }
    if (vInput) {
      vInput.addEventListener('input', function () {
        v_transverse = Number(vInput.value);
        document.getElementById('v-transverse-value').textContent = (v_transverse / 100).toFixed(2);
        renderSpectrum();
        renderExpansion();
        runValidation();
      });
    }
    if (modeSelect) {
      modeSelect.addEventListener('change', function () {
        spectrumMode = modeSelect.value;
        renderSpectrum();
      });
    }

    window.addEventListener('resize', function () {
      renderSpectrum();
      renderExpansion();
    });

    renderSpectrum();
    renderExpansion();
    runValidation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
