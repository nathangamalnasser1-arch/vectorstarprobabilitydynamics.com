/**
 * Skatepark City — Mykonos (Cyclades) location tab.
 * Run: node tests/skatepark-city-mykonos.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const mustInclude = [
  'id="loc-mk"',
  'ltab-mk',
  "switchLoc('mk')",
  'Drop into the Aegean',
  '365 Days of Flow',
  'Mykonos International Airport (JMK)',
  'Invest in Phase 5: Q3 2031 Groundbreaking',
  'Cycladic Industrial',
  'SPC-HRC-01',
  'SPC-QP-01',
  '40ft High Cube',
  '3D-printed terraces',
  '€18.96/m²',
  '100,000 SPC',
  'Market Terrace',
  'Greek Tax Number (AFM)',
  '2026 construction moratorium',
  'Special Urban Plan (EPS)',
  'natenate@vectorstarprobabilitydynamics.com',
  'spc-blueprint-table',
  'id="spc-sticky-coin"',
  'Buy SPC Coin',
];

mustInclude.forEach((s) => {
  assert.ok(html.includes(s), `Expected HTML to contain: ${s}`);
});

assert.ok(/function switchLoc\([\s\S]*mk:'loc-mk'/.test(html), 'switchLoc must map mk to loc-mk');
assert.ok(/const tabs=\{[\s\S]*mk:'ltab-mk'/.test(html), 'tabs must include ltab-mk');

console.log('ok: skatepark-city Mykonos tab content checks passed');
