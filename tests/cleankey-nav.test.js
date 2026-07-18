/**
 * Clean Key: present in site nav, booking app structure intact.
 * Run: node tests/cleankey-nav.test.js
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
    /href="cleankey\/index\.html"/.test(html),
    `${file} must link to cleankey/index.html`
  );
  assert.ok(/>Clean Key</.test(html), `${file} must label Clean Key in nav`);
}

const page = fs.readFileSync(path.join(root, 'cleankey', 'index.html'), 'utf8');
assert.ok(/The Clean Key/.test(page), 'app brands as The Clean Key');
assert.ok(
  /src="\/cleankey\/support\.js"/.test(page),
  'loads dc-runtime support.js via absolute /cleankey/ path'
);
assert.ok(/<x-dc>/.test(page), 'uses x-dc document root');
assert.ok(/Book a cleaning/.test(page), 'normal booking CTA present');
assert.ok(/startBigMess|bigger mess/.test(page), 'mess-detection entry present');
assert.ok(/BIG_MESS_ESTIMATE/.test(page), 'mess estimate logic present');
assert.ok(/class Component extends DCLogic/.test(page), 'DCLogic booking component present');
assert.ok(/Get AI estimate/.test(page), 'AI estimate CTA present');

assert.ok(
  fs.existsSync(path.join(root, 'cleankey', 'support.js')),
  'cleankey/support.js exists'
);

const natapps = fs.readFileSync(path.join(root, 'natapps.html'), 'utf8');
assert.ok(
  /<h2>The Clean Key<\/h2>/.test(natapps) &&
    /href="cleankey\/index\.html" class="app-btn"/.test(natapps),
  'natapps.html has Clean Key app card with Open link'
);

console.log('ok: cleankey nav + page structure checks passed');
