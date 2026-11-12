/**
 * DepthScan how-to guide: must document the ScanView flow with phone UI mocks.
 * Run: node tests/depthscan-guide.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'depthscan', 'guide.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(html.includes('How to use'), 'guide title present');
assert.ok(html.includes('UI mocks'), 'notes mocks until real screenshots exist');

const requiredSteps = [
  'WaitingForTableView',
  'Calibration · instructions',
  'Calibration · capturingBaseline',
  'Calibration · awaitingPose',
  'ScanningView',
  'ReviewCoverageView',
  'RelocateMagnetsView',
  'CompleteView',
];
for (const label of requiredSteps) {
  assert.ok(html.includes(label), `missing screen mock label: ${label}`);
}

const requiredCopy = [
  'Place phone face-up',
  'Magnets attached',
  'Capture pose',
  'SCANNING',
  'Move magnets &amp; fill gaps',
  'I moved them',
  'Scan complete',
];
for (const text of requiredCopy) {
  assert.ok(html.includes(text), `missing app UI copy: ${text}`);
}

assert.ok(html.includes('class="phone"'), 'phone frames present');
assert.strictEqual((html.match(/class="phone"/g) || []).length >= 8, true, 'at least 8 phone mocks');
assert.ok(html.includes('try.html'), 'links to beta install');
assert.ok(html.includes('VPN'), 'mentions trust / device management');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'depthscan', 'index.html'), 'utf8');
assert.ok(indexHtml.includes('guide.html'), 'product page links to guide');

console.log('ok: DepthScan guide covers ScanView steps with phone UI mocks');
