/**
 * SPC is the competition currency; merchant/buyer SPC use is optional — not city-wide mandatory money.
 * Run: node tests/skatepark-city-spc-currency-scope.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const bad = [
  'The city runs on SPC',
  'city runs on SPC — every gondola',
  'Every transaction inside the perimeter runs on SPC',
  'mandatory coin zone',
  'Every vendor terminal runs SPC only',
  'entire internal economy runs on',
  'Internal economy runs on SPC',
];

bad.forEach((s) => {
  assert.ok(!html.includes(s), `Must not contain misleading mandatory-currency phrase: ${s}`);
});

assert.ok(
  html.includes('SPC is the currency of competition'),
  'Coin section should state SPC is for competitions'
);
assert.ok(
  html.includes('merchants and buyers may adopt SPC if they want'),
  'Coin section should state optional adoption'
);

const chinaPath = path.join(__dirname, '..', 'china-gu.html');
const china = fs.readFileSync(chinaPath, 'utf8');
assert.ok(!china.includes('SPC coin economy active'), 'china-gu should not claim full coin economy as mandatory');
assert.ok(china.includes('optional') || china.includes('voluntarily'), 'china-gu should mention optional SPC use');

console.log('ok: SPC currency scope (competitions vs optional commerce) checks passed');
