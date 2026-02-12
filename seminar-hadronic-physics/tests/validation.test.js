/**
 * Unit tests — Validation (causal correlation, no spurious relationships)
 */

(function (global) {
  'use strict';

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  var path = require('path');
  var fs = require('fs');

  var shared = {};
  var physicsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'physicsEngine.js'), 'utf8');
  new Function('global', physicsCode)(shared);
  var validationCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'validation.js'), 'utf8');
  new Function('global', validationCode)(shared);
  var Validation = shared.Validation;
  assert(Validation && shared.PhysicsEngine, 'Validation and PhysicsEngine defined');

  function testLinearRegression() {
    var reg = Validation.linearRegression([1, 2, 3], [2, 4, 6]);
    assert(reg.slope > 1.9 && reg.slope < 2.1, 'Slope ~2');
    assert(reg.r2 > 0.99, 'R² ~1 for perfect line');
  }

  function testValidateExpansionVsEffectiveTemp() {
    var v = [0, 0.2, 0.4, 0.6];
    var T_eff = v.map(function (vx) { return shared.PhysicsEngine.effectiveTemperature(250, vx); });
    var result = Validation.validateExpansionVsEffectiveTemp(v, T_eff);
    assert(result.valid === true, 'Causal v→T_eff should be valid');
    assert(result.slope > 0, 'Positive slope');
  }

  function testValidateTeffFormula() {
    var samples = [
      { T_local_MeV: 250, v: 0, T_eff_MeV: 250 },
      { T_local_MeV: 250, v: 0.5, T_eff_MeV: shared.PhysicsEngine.effectiveTemperature(250, 0.5) }
    ];
    var result = Validation.validateTeffFormula(samples);
    assert(result.valid === true, 'T_eff formula consistent');
  }

  function run() {
    testLinearRegression();
    testValidateExpansionVsEffectiveTemp();
    testValidateTeffFormula();
    console.log('Validation tests passed');
  }

  run();
})(typeof global !== 'undefined' ? global : this);
