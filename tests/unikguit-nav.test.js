/**
 * Unikguit: present in site nav, page has sidebar + configurator.
 * Run: node tests/unikguit-nav.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');

const navPages = [
  'index.html',
  'theory.html',
  'thought-experiment.html',
  'comparisons.html',
  'experiments.html',
  'about.html',
  'hl-lhc-enrichment.html',
  'natapps.html',
  'accelperformaceexponential.html',
  'unikguit.html',
];

for (const file of navPages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(
    /href="unikguit\.html"/.test(html),
    `${file} must link to unikguit.html`
  );
  assert.ok(/>Unikguit</.test(html), `${file} must label Unikguit in nav`);
}

const page = fs.readFileSync(path.join(root, 'unikguit.html'), 'utf8');
assert.ok(/id="vspd-sidebar-nav"/.test(page), 'unikguit has sidebar nav');
assert.ok(/id="nav-mobile-toggle"/.test(page), 'unikguit has mobile nav toggle');
assert.ok(/js\/sidebar-nav\.js/.test(page), 'unikguit loads sidebar-nav.js');
assert.ok(/unikguit\.html" class="active"/.test(page), 'Unikguit nav item is active');
assert.ok(/id="instrumentSelect"/.test(page), 'configurator instrument select present');
assert.ok(/id="board"/.test(page), 'neck preview SVG present');
assert.ok(/id="exportStl"/.test(page), 'STL export control present');
assert.ok(/Fretting System Configurator/.test(page), 'page title marks fretting configurator');

const natapps = fs.readFileSync(path.join(root, 'natapps.html'), 'utf8');
assert.ok(
  /<h2>Unikguit<\/h2>/.test(natapps) && /href="unikguit\.html" class="app-btn"/.test(natapps),
  'natapps.html has Unikguit app card with Open link'
);

console.log('ok: unikguit nav + page structure checks passed');
