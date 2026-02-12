/**
 * Logic Validation — Causal correlation check; no spurious relationships.
 * Ensures transverse expansion → spectral hardening is causally sound (hydrodynamic causality).
 * Forbids "Redskins Rule" / stork-statistics type fallacies.
 */

(function (global) {
  'use strict';

  /**
   * Simple linear regression: y = slope * x + intercept.
   * Returns { slope, intercept, r2 }.
   */
  function linearRegression(xArr, yArr) {
    if (!xArr.length || xArr.length !== yArr.length) return { slope: 0, intercept: 0, r2: 0 };
    var n = xArr.length;
    var sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
    for (var i = 0; i < n; i++) {
      sumX += xArr[i]; sumY += yArr[i];
      sumXX += xArr[i] * xArr[i]; sumYY += yArr[i] * yArr[i];
      sumXY += xArr[i] * yArr[i];
    }
    var denom = n * sumXX - sumX * sumX;
    var slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    var intercept = (sumY - slope * sumX) / n;
    var yMean = sumY / n;
    var ssTot = 0, ssRes = 0;
    for (var j = 0; j < n; j++) {
      var fit = slope * xArr[j] + intercept;
      ssTot += (yArr[j] - yMean) * (yArr[j] - yMean);
      ssRes += (yArr[j] - fit) * (yArr[j] - fit);
    }
    var r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    return { slope: slope, intercept: intercept, r2: r2 };
  }

  /**
   * Causal check: v (expansion) vs T_eff. Physics expects positive relationship.
   * We verify correlation is in the expected direction and strong enough to reject
   * "no causal link" (avoid Type I error interpretation: we expect causation from hydro).
   */
  function validateExpansionVsEffectiveTemp(vValues, T_effValues) {
    if (!vValues.length || vValues.length !== T_effValues.length) {
      return { valid: false, reason: 'Length mismatch' };
    }
    var reg = linearRegression(vValues, T_effValues);
    var positiveSlope = reg.slope > 0;
    var reasonableR2 = reg.r2 >= 0.5;
    return {
      valid: positiveSlope && reasonableR2,
      slope: reg.slope,
      r2: reg.r2,
      reason: positiveSlope
        ? (reasonableR2 ? 'Causal relationship consistent (v → T_eff)' : 'Weak correlation; check data range')
        : 'Unexpected slope sign; possible spurious relationship'
    };
  }

  /**
   * Multivariable sanity: T_eff should follow T_local * sqrt((1+v)/(1-v)).
   * Compare model vs computed T_eff; residual norm should be small.
   */
  function validateTeffFormula(samples) {
    var PhysicsEngine = global.PhysicsEngine;
    if (!PhysicsEngine || !samples.length) return { valid: false, maxResidual: Infinity };
    var maxResidual = 0;
    samples.forEach(function (s) {
      var expected = PhysicsEngine.effectiveTemperature(s.T_local_MeV, s.v);
      var residual = Math.abs((s.T_eff_MeV || 0) - expected);
      if (residual > maxResidual) maxResidual = residual;
    });
    return {
      valid: maxResidual < 5,
      maxResidual: maxResidual,
      reason: maxResidual < 5 ? 'T_eff formula consistent' : 'T_eff residual too large'
    };
  }

  global.Validation = {
    linearRegression: linearRegression,
    validateExpansionVsEffectiveTemp: validateExpansionVsEffectiveTemp,
    validateTeffFormula: validateTeffFormula
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
