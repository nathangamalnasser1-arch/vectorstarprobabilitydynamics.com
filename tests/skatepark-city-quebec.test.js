/**
 * Content regression checks for Skatepark City Quebec (Laurentian Edition) tab.
 * Run: node tests/skatepark-city-quebec.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const mustInclude = [
  'id="loc-qc"',
  "switchLoc('qc')",
  'ltab-qc',
  'SPC-HRC-01',
  'SPC-QP-01',
  'Philippe D&apos;Aoust',
  'Point de Tangente',
  'Samael Piché',
  'Flow Parc',
  'Hugo Papillon',
  'Papillon Skateparks',
  'Rick Design Skateparks',
  'Quebec: The Next Vertical Drop',
  '93-acre',
  'Lantier',
  'Sainte-Marguerite-du-Lac-Masson',
  '175m',
  'Montreal-Trudeau',
  'SPC-MASTER-01 · Rev. 05 · Quebec Edition',
  'ambulances',
  '~$3.9B',
  'CAD',
  'US$2.8B',
];

mustInclude.forEach((s) => {
  assert.ok(html.includes(s), `Expected HTML to contain: ${s}`);
});

assert.ok(/function switchLoc\([\s\S]*qc:'loc-qc'/.test(html), 'switchLoc must map qc to loc-qc');
assert.ok(/const tabs=\{[\s\S]*qc:'ltab-qc'/.test(html), 'tabs must include ltab-qc');

console.log('ok: skatepark-city Quebec tab content checks passed');
