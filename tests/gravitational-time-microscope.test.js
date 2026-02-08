/**
 * Unit tests for The Gravitational Time Microscope site.
 * Run with: node tests/gravitational-time-microscope.test.js
 */
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'gravitational-time-microscope');

const pages = [
  { file: 'index.html', checks: [/Gravitational Time Microscope/, /VSPD/, /Time Microscope/, /Visual Proof|Precision Proof|Mechanistic Proof/] },
  { file: 'experiment1-cosmos.html', checks: [/COSMOS/, /The Blurry Picture/, /Invisible Scaffolding in Stunning Detail/, /slider-input|clip-path|range/, /hubble_cosmos\.jpg/, /webb_cosmos\.jpg/, /blur\(4px\)/, /windowpane of spacetime/] },
  { file: 'experiment2-black-hole-spectroscopy.html', checks: [/GW250114/, /Black Hole Spectroscopy/, /clearest look yet/, /tones/, /quantum gravity/] },
  { file: 'experiment3-sirius-b.html', checks: [/Sirius B/, /gravitational redshift/, /Balmer/, /time dilation/, /mechanistic/] },
];

let failed = 0;
for (const { file, checks } of pages) {
  const filePath = path.join(base, file);
  if (!fs.existsSync(filePath)) {
    console.error('MISSING:', file);
    failed++;
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const allPass = checks.every((re) => (typeof re === 'string' ? html.includes(re) : re.test(html)));
  if (!allPass) {
    console.error('FAIL:', file);
    failed++;
  } else {
    console.log('OK:', file);
  }
}

const hubblePath = path.join(base, 'images', 'hubble_cosmos.jpg');
const webbPath = path.join(base, 'images', 'webb_cosmos.jpg');
if (!fs.existsSync(hubblePath)) {
  console.error('MISSING: images/hubble_cosmos.jpg');
  failed++;
} else {
  console.log('OK: images/hubble_cosmos.jpg');
}
if (!fs.existsSync(webbPath)) {
  console.error('MISSING: images/webb_cosmos.jpg');
  failed++;
} else {
  console.log('OK: images/webb_cosmos.jpg');
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll Gravitational Time Microscope tests passed.');
process.exit(0);
