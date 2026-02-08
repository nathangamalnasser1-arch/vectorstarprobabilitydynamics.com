/**
 * Unit tests for GraphController: state, slider sync, measurement window, model toggle.
 * Run from project root: node tests/graphController.test.js
 */

const GraphController = require('../js/graphController.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

console.log('GraphController tests...');

const s0 = GraphController.getState();
assert(s0.deltaTNorm >= 0 && s0.deltaTNorm <= 1, 'initial deltaTNorm in range');
assert(typeof s0.modelVSPD === 'boolean', 'modelVSPD is boolean');

GraphController.setDeltaTNorm(0.7);
const s1 = GraphController.getState();
assert(s1.deltaTNorm === 0.7, 'setDeltaTNorm updates state');

GraphController.setMeasurementWindow(0.5, 0.3);
const s2 = GraphController.getState();
assert(s2.windowCenter === 0.5 && s2.windowSizeNorm === 0.3, 'setMeasurementWindow');

const edges = GraphController.getWindowEdges();
assert(edges.normStart >= 0 && edges.normEnd <= 1 && edges.normStart < edges.normEnd, 'getWindowEdges');

GraphController.setWindowEdges(0.2, 0.6);
const s3 = GraphController.getState();
assert(s3.windowCenter >= 0.2 && s3.windowCenter <= 0.6, 'setWindowEdges updates center');

GraphController.setModelVSPD(false);
assert(GraphController.getState().modelVSPD === false, 'setModelVSPD');

let notified = false;
const unsub = GraphController.subscribe(() => { notified = true; });
GraphController.setDeltaTNorm(0.4);
assert(notified, 'subscribe notifies on change');
unsub();

console.log('GraphController tests passed.');
