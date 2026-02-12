/**
 * Unit tests — Physics Engine
 * Thermal spectrum, Doppler T_eff, inverse slope.
 */

(function (global) {
  'use strict';

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  function assertApprox(a, b, tol, msg) {
    tol = tol != null ? tol : 1e-6;
    if (Math.abs(a - b) > tol) throw new Error((msg || 'Expected ~') + ' ' + a + ' ~ ' + b);
  }

  // Load physics engine in Node (no window)
  var path = require('path');
  var fs = require('fs');
  var physicsPath = path.join(__dirname, '..', 'js', 'physicsEngine.js');
  var code = fs.readFileSync(physicsPath, 'utf8');
  var sandbox = { PhysicsEngine: null };
  var fn = new Function('global', code + '\nreturn global.PhysicsEngine;');
  var PhysicsEngine = fn(sandbox);
  assert(PhysicsEngine, 'PhysicsEngine should be defined');

  function testThermalYield() {
    var y0 = PhysicsEngine.thermalYield(0, 250);
    assert(y0 > 0 && y0 <= 1, 'Yield at p_T=0 should be positive and ≤1');
    var y1 = PhysicsEngine.thermalYield(1, 250);
    assert(y1 < y0, 'Yield should decrease with p_T');
    var yHighT = PhysicsEngine.thermalYield(1, 400);
    assert(yHighT > y1, 'Higher T should give higher yield at same p_T');
  }

  function testEffectiveTemperature() {
    var T0 = PhysicsEngine.effectiveTemperature(250, 0);
    assertApprox(T0, 250, 0.1, 'T_eff at v=0 should equal T_local');
    var Tpos = PhysicsEngine.effectiveTemperature(250, 0.5);
    assert(Tpos > 250, 'T_eff with v>0 should be larger (blue-shift)');
    var Tcap = PhysicsEngine.effectiveTemperature(250, 1.5);
    assert(Tcap >= 0 && Tcap < 1e6, 'Clamped v should still give finite T_eff');
  }

  function testComputeSpectrum() {
    var pT = [0.5, 1.0, 2.0];
    var spec = PhysicsEngine.computeSpectrum(250, 0, pT);
    assert(spec.length === 3, 'Spectrum length');
    assert(spec[0].yield_local === spec[0].yield_effective, 'At v=0 local and effective match');
    var specFlow = PhysicsEngine.computeSpectrum(250, 0.4, pT);
    assert(specFlow[0].yield_effective > specFlow[0].yield_local, 'With flow, effective yield higher at same p_T for hardening');
  }

  function testInverseSlopeFromSpectrum() {
    var spec = PhysicsEngine.computeSpectrum(250, 0, [0.5, 1, 1.5, 2, 2.5]);
    var inv = PhysicsEngine.inverseSlopeFromSpectrum(spec, false);
    assert(inv.T_eff_MeV > 0, 'T_eff from inverse slope positive');
    assertApprox(inv.T_eff_MeV, 250, 80, 'T_eff from slope should be near 250 MeV for thermal');
  }

  function run() {
    testThermalYield();
    testEffectiveTemperature();
    testComputeSpectrum();
    testInverseSlopeFromSpectrum();
    console.log('Physics engine tests passed');
  }

  run();
})(typeof global !== 'undefined' ? global : this);
