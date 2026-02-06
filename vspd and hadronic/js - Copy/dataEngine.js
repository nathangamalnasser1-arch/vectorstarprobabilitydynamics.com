/**
 * DataEngine: VSPD–Hadronic data validation, Lorentz/Doppler transforms,
 * vector-star summation, inverse-slope (T_eff), and regression control.
 * Caches transformed states for 60fps interactivity.
 */

(function (global) {
  'use strict';

  const C = 299792458; // m/s, for v < c checks (use natural units c=1 in formulas)
  const C_NATURAL = 1;

  /**
   * Validate plasma profile: reject negative temperature or v > c.
   * @param {{ temperature?: number[], velocity?: number[] }} data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validateData(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid data: not an object'] };
    }
    const T = data.temperature;
    const v = data.velocity;
    if (Array.isArray(T)) {
      T.forEach((t, i) => {
        if (typeof t !== 'number' || t < 0) errors.push(`Invalid temperature at index ${i}: ${t}`);
      });
    }
    if (Array.isArray(v)) {
      v.forEach((vel, i) => {
        if (typeof vel !== 'number' || vel > C_NATURAL || vel < -C_NATURAL) {
          errors.push(`Invalid velocity at index ${i}: |v| must be < c`);
        }
      });
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Lorentz factor gamma(v) = 1 / sqrt(1 - v^2/c^2). Natural units c=1.
   */
  function gamma(v) {
    const v2 = v * v;
    if (v2 >= 1) return Infinity;
    return 1 / Math.sqrt(1 - v2);
  }

  /**
   * Doppler shift for photon energy: E' = E * gamma * (1 - beta*cos(theta)).
   * For radial flow along photon direction: E' = E * sqrt((1+beta)/(1-beta)).
   * Returns factor to multiply rest-frame energy.
   */
  function dopplerFactor(velocity, cosTheta) {
    const g = gamma(velocity);
    return g * (1 - velocity * cosTheta);
  }

  /**
   * Flow velocity profile (mock from Paquet-style context): T(t), v(t) over time.
   * Returns array of { t, T, v } in natural units.
   */
  function getFlowVelocityProfile(params) {
    const { tMin = 0, tMax = 10, steps = 50, expansionScale = 0.3 } = params || {};
    const profile = [];
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (tMax - tMin) * (i / steps);
      const x = (t - tMin) / (tMax - tMin);
      const T = 0.15 + 0.25 * (1 - x); // GeV, cooling
      const v = expansionScale * x * (1 - 0.3 * x); // radial flow, v < 1
      profile.push({ t, T, v });
    }
    const validation = validateData({
      temperature: profile.map(p => p.T),
      velocity: profile.map(p => p.v),
    });
    if (!validation.valid) throw new Error('Flow profile invalid: ' + validation.errors.join('; '));
    return profile;
  }

  /**
   * Map user Δt to integration window size (same units as profile time).
   */
  function deltaTToWindowSize(deltaT, tMin, tMax) {
    const span = tMax - tMin;
    const clamped = Math.max(0.01 * span, Math.min(span, deltaT));
    return clamped;
  }

  /**
   * Generate vector-star micro-paths (angles and weights) for given Δt.
   * Density scales with Δt to show superposition from duration.
   */
  function generateMicroPaths(deltaTNorm, count) {
    const n = Math.max(10, Math.min(500, Math.round(count * (0.5 + deltaTNorm))));
    const paths = [];
    for (let i = 0; i < n; i++) {
      const theta = Math.PI * (i / n);
      const weight = 1 + 0.5 * Math.sin(theta * 2);
      paths.push({ theta, weight });
    }
    return paths;
  }

  /**
   * Build photon energy spectrum (GeV) by summing Lorentz-boosted contributions
   * over the measurement window and micro-paths. Returns bins for 0.1–1.0 GeV.
   */
  function computePhotonSpectrum(options) {
    const {
      flowProfile,
      tStart,
      tEnd,
      microPaths,
      numBins = 40,
      eMin = 0.1,
      eMax = 1.0,
    } = options;

    const binEdges = [];
    for (let i = 0; i <= numBins; i++) {
      binEdges.push(eMin * Math.pow(eMax / eMin, i / numBins));
    }
    const spectrum = new Float64Array(numBins);

    const windowProfile = flowProfile.filter(p => p.t >= tStart && p.t <= tEnd);
    if (windowProfile.length === 0) return { binEdges, spectrum: Array.from(spectrum), binCenters: [] };

    for (const path of microPaths) {
      const cosTheta = Math.cos(path.theta);
      for (const point of windowProfile) {
        const factor = dopplerFactor(point.v, cosTheta);
        if (factor <= 0) continue;
        const E_rest = point.T * 2; // typical thermal scale ~2T
        const E_obs = E_rest * factor;
        const w = (path.weight || 1) / (windowProfile.length * microPaths.length);
        for (let b = 0; b < numBins; b++) {
          if (E_obs >= binEdges[b] && E_obs < binEdges[b + 1]) {
            spectrum[b] += w;
            break;
          }
        }
      }
    }

    const binCenters = binEdges.slice(0, -1).map((e, i) => (e + binEdges[i + 1]) / 2);
    return { binEdges, spectrum: Array.from(spectrum), binCenters };
  }

  /**
   * Inverse slope (effective temperature T_eff): dN/dE ∝ exp(-E/T_eff).
   * Fit log(dN/dE) vs E => slope = -1/T_eff.
   */
  function inverseSlopeFromSpectrum(binCenters, spectrum) {
    const n = binCenters.length;
    if (n < 3) return { T_eff: 0.2, slope: -5 };
    const E = binCenters.map(e => Math.max(e, 0.01));
    const logY = spectrum.map(y => Math.log(Math.max(y, 1e-10)));
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    let count = 0;
    for (let i = Math.floor(n * 0.3); i < n; i++) {
      if (!Number.isFinite(E[i]) || !Number.isFinite(logY[i])) continue;
      sumX += E[i];
      sumY += logY[i];
      sumXY += E[i] * logY[i];
      sumX2 += E[i] * E[i];
      count++;
    }
    if (count < 2) return { T_eff: 0.2, slope: -5 };
    const denom = count * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (count * sumXY - sumX * sumY) / denom : -5;
    const T_eff = slope < 0 ? -1 / slope : 0.2;
    return { T_eff, slope };
  }

  /**
   * Mock multivariable regression: control for transverse expansion to isolate Δt effect on T_eff.
   * Returns coefficients and residual so UI can show "controlled" relationship.
   */
  function mockMultivariableRegression(samples) {
    if (!samples || samples.length < 3) {
      return { beta_deltaT: 0, beta_expansion: 0, intercept: 0.2, residual: 0 };
    }
    const n = samples.length;
    let sumDt = 0, sumExp = 0, sumTeff = 0;
    let sumDt2 = 0, sumExp2 = 0, sumDtExp = 0, sumDtTeff = 0, sumExpTeff = 0;
    for (const s of samples) {
      const dt = s.deltaT ?? 0;
      const exp = s.expansion ?? 0;
      const teff = s.T_eff ?? 0.2;
      sumDt += dt; sumExp += exp; sumTeff += teff;
      sumDt2 += dt * dt; sumExp2 += exp * exp; sumDtExp += dt * exp;
      sumDtTeff += dt * teff; sumExpTeff += exp * teff;
    }
    const meanDt = sumDt / n, meanExp = sumExp / n, meanTeff = sumTeff / n;
    const covDtTeff = sumDtTeff / n - meanDt * meanTeff;
    const covExpTeff = sumExpTeff / n - meanExp * meanTeff;
    const varDt = sumDt2 / n - meanDt * meanDt;
    const varExp = sumExp2 / n - meanExp * meanExp;
    const covDtExp = sumDtExp / n - meanDt * meanExp;
    const denom = varDt * varExp - covDtExp * covDtExp;
    let beta_deltaT = 0, beta_expansion = 0;
    if (Math.abs(denom) > 1e-10) {
      beta_deltaT = (covDtTeff * varExp - covExpTeff * covDtExp) / denom;
      beta_expansion = (covExpTeff * varDt - covDtTeff * covDtExp) / denom;
    }
    const intercept = meanTeff - beta_deltaT * meanDt - beta_expansion * meanExp;
    let residual = 0;
    for (const s of samples) {
      const pred = intercept + beta_deltaT * (s.deltaT ?? 0) + beta_expansion * (s.expansion ?? 0);
      residual += ((s.T_eff ?? 0.2) - pred) ** 2;
    }
    residual = Math.sqrt(residual / n);
    return { beta_deltaT, beta_expansion, intercept, residual };
  }

  /**
   * Cache key for current state (Δt, window position, model toggle).
   */
  function cacheKey(deltaT, tStart, tEnd, modelVSPD) {
    return `${deltaT.toFixed(4)}_${tStart.toFixed(4)}_${tEnd.toFixed(4)}_${modelVSPD}`;
  }

  const cache = new Map();
  const CACHE_MAX = 200;

  function getCached(key) {
    return cache.get(key) ?? null;
  }

  function setCached(key, value) {
    if (cache.size >= CACHE_MAX) {
      const first = cache.keys().next().value;
      if (first !== undefined) cache.delete(first);
    }
    cache.set(key, value);
  }

  /**
   * Full pipeline: profile → window → micro-paths → spectrum → T_eff, with cache.
   */
  function runPipeline(state) {
    const {
      deltaTNorm = 0.5,
      tMin = 0,
      tMax = 10,
      windowCenter = 0.5,
      modelVSPD = true,
    } = state;

    const windowSize = deltaTToWindowSize(deltaTNorm * (tMax - tMin), tMin, tMax);
    const half = windowSize / 2;
    const tStart = Math.max(tMin, (tMin + (tMax - tMin) * windowCenter) - half);
    const tEnd = Math.min(tMax, tStart + windowSize);

    const key = cacheKey(deltaTNorm, tStart, tEnd, modelVSPD);
    const cached = getCached(key);
    if (cached) return cached;

    const flowProfile = getFlowVelocityProfile({ tMin, tMax, expansionScale: 0.35 });
    const microPaths = generateMicroPaths(deltaTNorm, 200);
    const { binEdges, spectrum, binCenters } = computePhotonSpectrum({
      flowProfile,
      tStart,
      tEnd,
      microPaths,
    });
    const { T_eff, slope } = inverseSlopeFromSpectrum(binCenters, spectrum);

    const result = {
      flowProfile,
      tStart,
      tEnd,
      windowSize,
      microPaths,
      binEdges,
      spectrum,
      binCenters,
      T_eff,
      slope,
    };
    setCached(key, result);
    return result;
  }

  const DataEngine = {
    validateData,
    gamma,
    dopplerFactor,
    getFlowVelocityProfile,
    deltaTToWindowSize,
    generateMicroPaths,
    computePhotonSpectrum,
    inverseSlopeFromSpectrum,
    mockMultivariableRegression,
    runPipeline,
    getCached,
    setCached,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataEngine;
  } else {
    global.DataEngine = DataEngine;
  }
})(typeof window !== 'undefined' ? window : this);
