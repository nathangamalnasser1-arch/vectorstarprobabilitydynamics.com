/**
 * Unit tests — Data Pipeline (5-step)
 * Gather, Assess, Cleanse, Transform, Store.
 */

(function (global) {
  'use strict';

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  var path = require('path');
  var fs = require('fs');

  function loadScript(name) {
    var code = fs.readFileSync(path.join(__dirname, '..', 'js', name + '.js'), 'utf8');
    var sandbox = {};
    new Function('global', code)(sandbox);
    return sandbox;
  }

  var physicsPath = path.join(__dirname, '..', 'js', 'physicsEngine.js');
  var physicsCode = fs.readFileSync(physicsPath, 'utf8');
  var physicsSandbox = {};
  new Function('global', physicsCode)(physicsSandbox);
  global.PhysicsEngine = physicsSandbox.PhysicsEngine;

  var pipelinePath = path.join(__dirname, '..', 'js', 'dataPipeline.js');
  var pipelineCode = fs.readFileSync(pipelinePath, 'utf8');
  var pipelineSandbox = { PhysicsEngine: global.PhysicsEngine };
  new Function('global', pipelineCode)(pipelineSandbox);
  var DataPipeline = pipelineSandbox.DataPipeline;
  assert(DataPipeline, 'DataPipeline defined');

  function testGather() {
    var raw = DataPipeline.gather(
      [{ p_T: 1, yield_local: 0.5 }],
      [{ v: 0.2 }]
    );
    assert(raw.spectrum.length === 1 && raw.flow.length === 1, 'Gather');
  }

  function testDiscoverAndAssess() {
    var data = DataPipeline.gather(
      [{ p_T: 0.5 }, { p_T: 2 }],
      [{ v: 0.3 }]
    );
    var a = DataPipeline.discoverAndAssess(data);
    assert(a.limits.pT_min === 0.5 && a.limits.pT_max === 2 && a.limits.v_max === 0.3, 'Assess limits');
  }

  function testCleanseAndValidate() {
    var data = DataPipeline.gather(
      [{ p_T: 1, yield_local: 0.1 }, { p_T: -1, yield_local: 0.5 }, { p_T: 2, yield_local: 0 }],
      [{ v: 0.5 }, { v: 1.5 }]
    );
    var a = DataPipeline.discoverAndAssess(data);
    var c = DataPipeline.cleanseAndValidate(a);
    assert(c.spectrum.length === 1, 'Cleanse spectrum');
    assert(c.flow.length === 1, 'Cleanse flow (v<1)');
  }

  function testTransformAndEnrich() {
    var data = DataPipeline.gather(
      [{ p_T: 0.5, yield_local: 0.5, yield_effective: 0.5 }, { p_T: 1.0, yield_local: 0.2, yield_effective: 0.2 }],
      []
    );
    var a = DataPipeline.discoverAndAssess(data);
    var c = DataPipeline.cleanseAndValidate(a);
    var t = DataPipeline.transformAndEnrich(c, 250, 0.4);
    assert(t.T_local_MeV === 250 && t.v_transverse === 0.4, 'Enrich params');
    assert(t.T_eff_MeV > 250, 'T_eff > T_local for v>0');
    assert(t.spectrum.length === 2, 'Enriched spectrum length');
  }

  function testRunPipeline() {
    var stored = DataPipeline.runPipeline(null, null, 300, 0.2);
    assert(stored.metadata && stored.metadata.validated === true, 'Store metadata');
    assert(stored.T_eff_MeV > stored.T_local_MeV, 'Stored T_eff > T_local');
  }

  function run() {
    testGather();
    testDiscoverAndAssess();
    testCleanseAndValidate();
    testTransformAndEnrich();
    testRunPipeline();
    console.log('Data pipeline tests passed');
  }

  run();
})(typeof global !== 'undefined' ? global : this);
