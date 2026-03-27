/**
 * SPC-SOC-01 social earn rule: only #SkateparkCity qualifies (not plain-text name).
 * Run: node tests/skatepark-city-spc-soc-01.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('<!-- SOCIAL COIN EARN -->');
const end = html.indexOf('<!-- BRAND RETAIL DISTRICT -->');
assert.ok(start > 0 && end > start);
const block = html.slice(start, end);

assert.ok(block.includes('SPC-SOC-01'), 'section block present');
assert.ok(
  /includes the hashtag.*#SkateparkCity/.test(block.replace(/\s+/g, ' ')),
  'lead copy must require hashtag #SkateparkCity'
);
assert.ok(block.includes('Plain text without the tag does not qualify'), 'must exclude plain-text-only posts');
assert.ok(!block.includes('"Skatepark City" or #SkateparkCity'), 'must not offer dual qualification (text OR tag)');
assert.ok(block.includes('Post must include'), 'visibility rule must reference required tag');
assert.ok(block.includes('WHAT QUALIFIES'), 'qualification table present');
assert.ok(block.includes('#SkateparkCity (required)'), 'WHAT QUALIFIES must require hashtag only');
assert.ok(
  /SPC-SOC-01 IN ONE LINE.*#SkateparkCity/.test(block.replace(/\s+/g, ' ')),
  'one-line summary must use #SkateparkCity not plain-text name'
);

console.log('ok: SPC-SOC-01 hashtag-only rule checks passed');
