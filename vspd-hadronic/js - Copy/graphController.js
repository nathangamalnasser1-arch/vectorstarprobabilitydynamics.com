/**
 * GraphController: Central state for Δt / Plasma Expansion, measurement window
 * (tStart, tEnd), and model toggle. Syncs TheoryContainer, ApplicationModule, and
 * temporal evolution view with draggable yellow measurement window.
 */

(function (global) {
  'use strict';

  const DEFAULT_STATE = {
    deltaTNorm: 0.5,
    tMin: 0,
    tMax: 10,
    windowCenter: 0.5,
    windowSizeNorm: 0.3,
    modelVSPD: true,
  };

  let state = { ...DEFAULT_STATE };
  const listeners = [];

  function getState() {
    return { ...state };
  }

  function setState(updates) {
    let changed = false;
    for (const key of Object.keys(updates)) {
      if (state[key] !== updates[key]) {
        state[key] = updates[key];
        changed = true;
      }
    }
    if (changed) {
      listeners.forEach(fn => fn(getState()));
    }
    return getState();
  }

  /**
   * Set Δt / Plasma Expansion (0..1). Updates window size and notifies.
   */
  function setDeltaTNorm(value) {
    const v = Math.max(0.02, Math.min(1, Number(value)));
    return setState({ deltaTNorm: v, windowSizeNorm: v });
  }

  /**
   * Set measurement window by center and normalized size (0..1).
   */
  function setMeasurementWindow(center, sizeNorm) {
    return setState({
      windowCenter: Math.max(0, Math.min(1, Number(center))),
      windowSizeNorm: Math.max(0.02, Math.min(1, Number(sizeNorm))),
    });
  }

  /**
   * Set window edges in normalized time [0,1]. Used by draggable overlay.
   */
  function setWindowEdges(normStart, normEnd) {
    const start = Math.max(0, Math.min(1, Number(normStart)));
    const end = Math.max(start + 0.02, Math.min(1, Number(normEnd)));
    const center = (start + end) / 2;
    const sizeNorm = end - start;
    return setState({ windowCenter: center, windowSizeNorm: sizeNorm, deltaTNorm: sizeNorm });
  }

  function getWindowEdges() {
    const half = state.windowSizeNorm / 2;
    const start = Math.max(0, state.windowCenter - half);
    const end = Math.min(1, state.windowCenter + half);
    return { normStart: start, normEnd: end };
  }

  function setModelVSPD(useVSPD) {
    return setState({ modelVSPD: Boolean(useVSPD) });
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  const GraphController = {
    getState,
    setState,
    setDeltaTNorm,
    setMeasurementWindow,
    setWindowEdges,
    getWindowEdges,
    setModelVSPD,
    subscribe,
    DEFAULT_STATE,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphController;
  } else {
    global.GraphController = GraphController;
  }
})(typeof window !== 'undefined' ? window : this);
