/**
 * Skatepark City — Brazil (São Paulo North) location tab.
 * Run: node tests/skatepark-city-brazil.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const mustInclude = [
  'id="loc-br"',
  'ltab-br',
  "switchLoc('br')",
  'The Summit of São Paulo',
  'Roll to Work. Wheels-first. Always.',
  'Jaçanã',
  'Tremembé',
  'GRU',
  '$2.002B',
  'SPC-HRC-01',
  'SPC-QP-01',
  'House Rolling Code',
  '$1 = 100,000 SPC',
  'Vans',
  'Nike SB',
  'Independent',
  'spc-blueprint-table',
  'Strategic Master Plan (PDE)',
  'PIIA',
  'natenate@vectorstarprobabilitydynamics.com',
  'Phase 4: Q3 2031 Groundbreaking',
];

mustInclude.forEach((s) => {
  assert.ok(html.includes(s), `Expected HTML to contain: ${s}`);
});

assert.ok(/function switchLoc\([\s\S]*br:'loc-br'/.test(html), 'switchLoc must map br to loc-br');
assert.ok(/const tabs=\{[\s\S]*br:'ltab-br'/.test(html), 'tabs must include ltab-br');

console.log('ok: skatepark-city Brazil tab content checks passed');
