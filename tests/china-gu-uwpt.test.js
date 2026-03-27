/**
 * China × Gu page — heated UWPT (Underway Pumptrack) copy.
 * Run: node tests/china-gu-uwpt.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'china-gu.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(html.includes('UWPT — China edition'), 'section label');
assert.ok(/heated UWPT/i.test(html), 'heated UWPT');
assert.ok(/Underway Pumptrack/i.test(html), 'underway pumptrack expansion');
assert.ok(/ski, snowboard, and snowmobile/i.test(html), 'winter exterior modes');
assert.ok(/many exits/i.test(html), 'many exits from UWPT');
assert.ok(/rainy days/i.test(html) && /UWPT water evacuation/i.test(html), 'rainy-day UWPT');

console.log('ok: china-gu UWPT content checks passed');
