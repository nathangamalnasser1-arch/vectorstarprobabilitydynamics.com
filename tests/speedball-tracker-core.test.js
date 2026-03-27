/**
 * Unit tests for speedball-tracker-core.js
 * Run: node tests/speedball-tracker-core.test.js
 */
const assert = require('assert');
const path = require('path');
const core = require(path.join(__dirname, '..', 'speedball-tracker-core.js'));

function assertApprox(a, b, eps, msg) {
  assert.ok(Math.abs(a - b) <= eps, msg + ' — expected ~' + b + ', got ' + a);
}

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('OK:', name);
  } catch (e) {
    console.error('FAIL:', name, e.message);
    failed++;
  }
}

test('HITS_PER_PUNCH is 3', () => {
  assert.strictEqual(core.HITS_PER_PUNCH, 3);
});

test('calcBpmFromPunches: empty → 0', () => {
  assert.strictEqual(core.calcBpmFromPunches([], Date.now()), 0);
});

test('calcBpmFromPunches: two punches 1s apart → 180 BPM (3 hits/min per punch slot)', () => {
  const t0 = 1000000;
  const punches = [t0, t0 + 1000];
  const bpm = core.calcBpmFromPunches(punches, t0 + 2000, 6000);
  assert.strictEqual(bpm, 180);
});

test('calcBpmFromPunches: three punches 2s span → 180 BPM', () => {
  const t0 = 500000;
  const punches = [t0, t0 + 1000, t0 + 2000];
  const bpm = core.calcBpmFromPunches(punches, t0 + 3000, 6000);
  assert.strictEqual(bpm, 180);
});

test('impactEnergyRatio: all low bins → ~0', () => {
  const fftSize = 512;
  const sr = 48000;
  const n = fftSize / 2;
  const freq = new Uint8Array(n);
  for (let i = 0; i < 24; i++) freq[i] = 200;
  const r = core.impactEnergyRatio(freq, sr, fftSize);
  assert.ok(r < 0.05, 'ratio should be tiny');
});

test('impactEnergyRatio: energy only in high bins → high ratio', () => {
  const fftSize = 512;
  const sr = 48000;
  const n = fftSize / 2;
  const freq = new Uint8Array(n);
  for (let i = 0; i < n; i++) freq[i] = i > 40 ? 250 : 5;
  const r = core.impactEnergyRatio(freq, sr, fftSize);
  assert.ok(r > 0.5, 'ratio should be dominant HF');
});

test('minImpactRatioForSensitivity: high sens → lower floor', () => {
  const low = core.minImpactRatioForSensitivity(100);
  const high = core.minImpactRatioForSensitivity(1);
  assert.ok(low < high);
});

test('trimPunchTimes drops old entries', () => {
  const now = 1e12;
  const pts = [now - 5000, now - 1000];
  const kept = core.trimPunchTimes(pts, now, 3000);
  assert.strictEqual(kept.length, 1);
});

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll speedball-tracker-core tests passed.');
process.exit(0);
