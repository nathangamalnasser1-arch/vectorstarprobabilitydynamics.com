/**
 * Unit tests for DataEngine: validation, Lorentz/Doppler, regression, caching.
 * Run from project root: node tests/dataEngine.test.js
 */

const DataEngine = require('../js/dataEngine.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertApprox(a, b, tol, msg) {
  if (Math.abs(a - b) > (tol || 1e-10)) throw new Error(msg || `Expected ${a} ≈ ${b}`);
}

console.log('DataEngine tests...');

const r = DataEngine.validateData({});
assert(r.valid === true, 'empty data should be valid');

const r2 = DataEngine.validateData({ temperature: [1, 2, -1] });
assert(r2.valid === false && r2.errors.length > 0, 'negative temperature should be invalid');

const r3 = DataEngine.validateData({ velocity: [0.5, 1.5] });
assert(r3.valid === false && r3.errors.some(e => e.includes('velocity')), 'v > c should be invalid');

assert(DataEngine.gamma(0) === 1, 'gamma(0) === 1');
assert(DataEngine.gamma(0.5) > 1, 'gamma(0.5) > 1');

const f = DataEngine.dopplerFactor(0.1, 1);
assert(f > 0 && Number.isFinite(f), 'doppler factor positive and finite');

const profile = DataEngine.getFlowVelocityProfile({ tMin: 0, tMax: 5, steps: 10 });
assert(Array.isArray(profile) && profile.length === 11, 'profile length');
assert(profile.every(p => p.T >= 0 && p.v >= 0 && p.v <= 1), 'profile T,v bounds');

const paths = DataEngine.generateMicroPaths(0.5, 100);
assert(Array.isArray(paths) && paths.length >= 10, 'micro-paths generated');

const result = DataEngine.runPipeline({ deltaTNorm: 0.5, tMin: 0, tMax: 10, windowCenter: 0.5, modelVSPD: true });
assert(result.flowProfile && result.binCenters && result.spectrum, 'pipeline returns spectrum');
assert(result.T_eff > 0 && Number.isFinite(result.T_eff), 'T_eff positive');
assert(result.tStart < result.tEnd, 'tStart < tEnd');

const reg = DataEngine.mockMultivariableRegression([
  { deltaT: 0.2, expansion: 0.1, T_eff: 0.18 },
  { deltaT: 0.5, expansion: 0.2, T_eff: 0.22 },
  { deltaT: 0.8, expansion: 0.25, T_eff: 0.25 },
]);
assert(Number.isFinite(reg.beta_deltaT) && Number.isFinite(reg.residual), 'regression returns coefficients');

console.log('DataEngine tests passed.');
