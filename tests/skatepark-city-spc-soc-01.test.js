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
assert.ok(block.includes('without the tag does not qualify'), 'must exclude plain-text-only posts');
assert.ok(!block.includes('"Skatepark City" or #SkateparkCity'), 'must not offer dual qualification (text OR tag)');
assert.ok(block.includes('Post must include'), 'visibility rule must reference required tag');
assert.ok(block.includes('WHAT QUALIFIES'), 'qualification table present');
assert.ok(block.includes('#SkateparkCity') && block.includes('plain name alone does not qualify'), 'WHAT QUALIFIES must require hashtag only');
assert.ok(
  /link(ed)? your SPC account|linked profile|SPC wallet linked/i.test(block),
  'must require linking SPC account to social profile'
);
assert.ok(
  /reevaluat|likes-per-coin|likes per coin|10K:1 opening/i.test(block.replace(/\s+/g, ' ')),
  'must state likes-per-coin reevaluation with SPC revaluation'
);
assert.ok(
  /SPC-SOC-01 IN ONE LINE.*#SkateparkCity/.test(block.replace(/\s+/g, ' ')),
  'one-line summary must use #SkateparkCity not plain-text name'
);
assert.ok(block.includes('IMYTA MTL 2026'), 'must define earn window through IMYTA MTL 2026 launch day');
assert.ok(
  /launch day|launch-day/i.test(block) && /IMYTA MTL 2026/.test(block),
  'must tie sunset window to IMYTA MTL 2026 launch day'
);

console.log('ok: SPC-SOC-01 hashtag-only + IMYTA MTL 2026 window checks passed');
