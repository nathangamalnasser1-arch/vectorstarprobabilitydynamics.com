/**
 * Main bootstrap: component hierarchy (TheoryContainer, GraphController, DataEngine),
 * module switching, synthesis slider, measurement window, and live pipeline updates.
 */

(function () {
  'use strict';

  let theoryInstance;
  let applicationInstance;
  let applicationSynthesisInstance;
  let temporalInstance;
  let lastPipelineResult = null;
  const regressionSamples = [];
  const MAX_REGRESSION_SAMPLES = 25;

  function getMergedState() {
    const ctrl = typeof GraphController !== 'undefined' ? GraphController.getState() : {};
    const tMin = ctrl.tMin ?? 0;
    const tMax = ctrl.tMax ?? 10;
    return { ...ctrl, tMin, tMax, ...lastPipelineResult };
  }

  function runPipelineAndUpdate() {
    const state = typeof GraphController !== 'undefined' ? GraphController.getState() : {};
    if (typeof DataEngine === 'undefined') return;
    lastPipelineResult = DataEngine.runPipeline({
      deltaTNorm: state.deltaTNorm,
      tMin: state.tMin,
      tMax: state.tMax,
      windowCenter: state.windowCenter,
      modelVSPD: state.modelVSPD,
    });
    if (typeof ApplicationModule !== 'undefined' && ApplicationModule.update) {
      ApplicationModule.update(lastPipelineResult);
    }
    if (temporalInstance && temporalInstance.render) {
      temporalInstance.render();
    }
    if (lastPipelineResult && typeof DataEngine !== 'undefined' && DataEngine.mockMultivariableRegression) {
      const state = GraphController.getState();
      const expansion = lastPipelineResult.flowProfile && lastPipelineResult.flowProfile.length
        ? lastPipelineResult.flowProfile.reduce((s, p) => s + p.v, 0) / lastPipelineResult.flowProfile.length
        : 0;
      regressionSamples.push({
        deltaT: state.deltaTNorm,
        expansion,
        T_eff: lastPipelineResult.T_eff,
      });
      if (regressionSamples.length > MAX_REGRESSION_SAMPLES) regressionSamples.shift();
      const reg = DataEngine.mockMultivariableRegression(regressionSamples);
      const el = document.getElementById('regression-display');
      if (el) {
        el.textContent = 'Regression (control for expansion): β_Δt = ' +
          reg.beta_deltaT.toFixed(4) + ', β_expansion = ' + reg.beta_expansion.toFixed(4) +
          ', residual ≈ ' + reg.residual.toFixed(4);
      }
    }
  }

  function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tabs button[data-module]');
    const modules = document.querySelectorAll('.module');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-module');
        tabs.forEach(b => b.classList.remove('active'));
        modules.forEach(m => m.classList.remove('active'));
        btn.classList.add('active');
        const el = document.getElementById('module-' + id);
        if (el) el.classList.add('active');
      });
    });
  }

  function initSynthesisSlider() {
    const slider = document.getElementById('delta-t-slider');
    if (!slider || typeof GraphController === 'undefined') return;
    slider.addEventListener('input', () => {
      GraphController.setDeltaTNorm(parseFloat(slider.value));
      runPipelineAndUpdate();
    });
  }

  function initModelToggle() {
    const select = document.getElementById('model-select');
    if (!select || typeof GraphController === 'undefined') return;
    select.addEventListener('change', () => {
      GraphController.setModelVSPD(select.value === 'vspd');
      runPipelineAndUpdate();
    });
  }

  function initTheory() {
    const container = document.getElementById('theory-canvas-container');
    if (!container || typeof TheoryContainer === 'undefined' || typeof GraphController === 'undefined') return;
    theoryInstance = TheoryContainer.init(container, GraphController.getState);
  }

  function initApplication() {
    const container = document.getElementById('application-canvas-container');
    if (!container || typeof ApplicationModule === 'undefined') return;
    applicationInstance = ApplicationModule.init(container);
  }

  function initSynthesisModule() {
    const temporalContainer = document.getElementById('temporal-canvas-container');
    const appContainer = document.getElementById('application-synthesis-container');
    if (!temporalContainer || !appContainer) return;

    if (typeof TemporalEvolutionView !== 'undefined' && typeof GraphController !== 'undefined') {
      temporalInstance = TemporalEvolutionView.init(
        temporalContainer,
        getMergedState,
        (normStart, normEnd) => {
          GraphController.setWindowEdges(normStart, normEnd);
          runPipelineAndUpdate();
        }
      );
    }
    if (typeof ApplicationModule !== 'undefined') {
      applicationSynthesisInstance = ApplicationModule.init(appContainer);
    }
  }

  function onStateChange() {
    const slider = document.getElementById('delta-t-slider');
    if (slider && typeof GraphController !== 'undefined') {
      const s = GraphController.getState();
      const v = parseFloat(slider.value);
      if (Math.abs(v - s.deltaTNorm) > 0.001) slider.value = s.deltaTNorm;
    }
    runPipelineAndUpdate();
  }

  function init() {
    initNavigation();
    initSynthesisSlider();
    initModelToggle();
    initTheory();
    initApplication();
    initSynthesisModule();

    if (typeof GraphController !== 'undefined') {
      GraphController.subscribe(onStateChange);
    }
    runPipelineAndUpdate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
