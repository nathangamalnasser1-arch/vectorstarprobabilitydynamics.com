/**
 * IMYTA 2026 nav button opens YouTube embed modal.
 * Run: node tests/skatepark-city-imyta-modal.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(html.includes('id="imyta-open"'), 'IMYTA open button present');
assert.ok(html.includes('class="nav-imyta"'), 'nav uses .nav-imyta');
assert.ok(html.includes('IMYTA 2026'), 'button label IMYTA 2026');
assert.ok(html.includes('id="imyta-overlay"'), 'modal overlay present');
assert.ok(html.includes('id="imyta-close"'), 'modal close control present');
assert.ok(
  html.includes('https://www.youtube.com/embed/XQjIfkLhKUc'),
  'YouTube embed URL'
);
assert.ok(
  /allow="[^"]*accelerometer[^"]*picture-in-picture/.test(html),
  'iframe allow list includes expected capabilities'
);
assert.ok(html.includes('IMYTA 6 - Montreal (2002)'), 'iframe title attribute');
assert.ok(
  html.includes('openImyta') && html.includes('closeImyta'),
  'modal open/close script present'
);

console.log('ok: IMYTA 2026 modal checks passed');
