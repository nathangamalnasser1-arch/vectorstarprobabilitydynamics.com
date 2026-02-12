/**
 * Physics Engine — Thermal EM radiation from deconfined nuclear matter
 * Context: Jean-François Paquet (Vanderbilt) / McGill seminar
 * Lorentz-invariant spectrum dN^γ/d²p_T dy; effective temperature from inverse slope.
 */

(function (global) {
  'use strict';

  const T_MEV_TO_GEV = 0.001;

  /**
   * Boltzmann-like thermal spectrum (exponential in p_T / T).
   * dN/d²p_T dy ∝ exp(-p_T / T) for simplified thermal emission.
   * @param {number} pT - Transverse momentum (GeV)
   * @param {number} T_MeV - Local temperature (MeV)
   * @returns {number} Relative yield (arbitrary units)
   */
  function thermalYield(pT, T_MeV) {
    const T_GeV = T_MeV * T_MEV_TO_GEV;
    if (T_GeV <= 0) return 0;
    return Math.exp(-pT / T_GeV);
  }

  /**
   * Effective temperature from Doppler blue-shift (transverse flow).
   * T_eff ≈ T_local × √((1+v)/(1-v)); causal: expansion causes spectral hardening.
   * @param {number} T_local_MeV - Rest-frame temperature (MeV)
   * @param {number} v - Transverse flow speed (0 ≤ v < 1)
   * @returns {number} T_eff in MeV
   */
  function effectiveTemperature(T_local_MeV, v) {
    v = Math.max(0, Math.min(0.99, v));
    const factor = Math.sqrt((1 + v) / (1 - v));
    return T_local_MeV * factor;
  }

  /**
   * Generate spectrum points for a given T and optional flow (Doppler-shifted).
   * @param {number} T_MeV - Temperature (MeV)
   * @param {number} v - Flow speed (0 = local only)
   * @param {number[]} pT_GeV - List of p_T values (GeV)
   * @returns {{ p_T: number, yield_local: number, yield_effective: number }[]}
   */
  function computeSpectrum(T_MeV, v, pT_GeV) {
    const T_eff = effectiveTemperature(T_MeV, v);
    return pT_GeV.map(function (pT) {
      return {
        p_T: pT,
        yield_local: thermalYield(pT, T_MeV),
        yield_effective: thermalYield(pT, T_eff)
      };
    });
  }

  /**
   * Inverse slope (1/T_eff) from linear fit to ln(yield) vs p_T in range.
   * Returns { slope, T_eff_MeV, intercept }.
   */
  function inverseSlopeFromSpectrum(spectrum, useEffective) {
    const key = useEffective ? 'yield_effective' : 'yield_local';
    const points = spectrum
      .filter(function (d) { return d[key] > 1e-10; })
      .map(function (d) { return { x: d.p_T, y: Math.log(d[key]) }; });
    if (points.length < 2) return { slope: 0, T_eff_MeV: 0, intercept: 0 };
    const n = points.length;
    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
    points.forEach(function (p) {
      sumX += p.x; sumY += p.y; sumXX += p.x * p.x; sumXY += p.x * p.y;
    });
    const denom = n * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;
    const T_eff_GeV = slope < 0 ? -1 / slope : 0;
    return { slope, T_eff_MeV: T_eff_GeV * 1000, intercept };
  }

  global.PhysicsEngine = {
    thermalYield: thermalYield,
    effectiveTemperature: effectiveTemperature,
    computeSpectrum: computeSpectrum,
    inverseSlopeFromSpectrum: inverseSlopeFromSpectrum,
    T_MEV_TO_GEV: T_MEV_TO_GEV
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
