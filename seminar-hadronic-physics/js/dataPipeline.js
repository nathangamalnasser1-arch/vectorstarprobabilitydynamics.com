/**
 * Data Pipeline — 5-step workflow (Gather, Discover/Assess, Cleanse, Transform, Store)
 * Ensures GeV-photon data is validated and causal before visualization.
 */

(function (global) {
  'use strict';

  function gather(rawSpectrum, rawFlow) {
    return { spectrum: rawSpectrum || [], flow: rawFlow || [] };
  }

  function discoverAndAssess(data) {
    var limits = { pT_min: Infinity, pT_max: -Infinity, v_max: -Infinity };
    data.spectrum.forEach(function (d) {
      if (d.p_T != null) {
        limits.pT_min = Math.min(limits.pT_min, d.p_T);
        limits.pT_max = Math.max(limits.pT_max, d.p_T);
      }
    });
    (data.flow || []).forEach(function (d) {
      if (d.v != null) limits.v_max = Math.max(limits.v_max, d.v);
    });
    return { data: data, limits: limits };
  }

  function cleanseAndValidate(assessed) {
    var data = assessed.data;
    var spectrum = (data.spectrum || []).filter(function (d) {
      return typeof d.p_T === 'number' && d.p_T > 0 &&
             (d.yield_local > 0 || d.yield_effective > 0);
    });
    var flow = (data.flow || []).filter(function (d) {
      return typeof d.v === 'number' && d.v >= 0 && d.v < 1;
    });
    return { spectrum: spectrum, flow: flow, limits: assessed.limits };
  }

  function transformAndEnrich(cleaned, T_local_MeV, v_transverse) {
    var PhysicsEngine = global.PhysicsEngine;
    if (!PhysicsEngine) return cleaned;
    var T_eff = PhysicsEngine.effectiveTemperature(T_local_MeV, v_transverse);
    var pT_vals = cleaned.spectrum.map(function (d) { return d.p_T; });
    var enriched = PhysicsEngine.computeSpectrum(T_local_MeV, v_transverse, pT_vals);
    return {
      spectrum: enriched,
      flow: cleaned.flow,
      limits: cleaned.limits,
      T_local_MeV: T_local_MeV,
      v_transverse: v_transverse,
      T_eff_MeV: T_eff
    };
  }

  function store(enriched) {
    return {
      metadata: { pipeline: 'Store', validated: true },
      T_local_MeV: enriched.T_local_MeV,
      v_transverse: enriched.v_transverse,
      T_eff_MeV: enriched.T_eff_MeV,
      spectrum: enriched.spectrum,
      flow: enriched.flow
    };
  }

  /**
   * Run full pipeline: raw → stored. T_local_MeV and v_transverse drive transform.
   */
  function runPipeline(rawSpectrum, rawFlow, T_local_MeV, v_transverse) {
    T_local_MeV = T_local_MeV != null ? T_local_MeV : 250;
    v_transverse = v_transverse != null ? v_transverse : 0;
    var g = gather(rawSpectrum, rawFlow);
    var a = discoverAndAssess(g);
    var c = cleanseAndValidate(a);
    var t = transformAndEnrich(c, T_local_MeV, v_transverse);
    return store(t);
  }

  global.DataPipeline = {
    gather: gather,
    discoverAndAssess: discoverAndAssess,
    cleanseAndValidate: cleanseAndValidate,
    transformAndEnrich: transformAndEnrich,
    store: store,
    runPipeline: runPipeline
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
