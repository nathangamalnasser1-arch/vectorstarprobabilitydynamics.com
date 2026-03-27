/**
 * CTA grid GoFundMe URLs — unified campaign for most cards; Japan + El Salvador unchanged.
 * Run: node tests/skatepark-city-gofundme-cta.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const unified = 'https://gofund.me/97cdff3f9';
const keepSv = 'https://www.gofundme.com/f/skatepark-city-miramundo';
const keepJp = 'https://www.gofundme.com/f/skatepark-city-japan';

assert.ok(html.includes(keepSv), 'El Salvador CTA must keep original Miramundo fundraiser');
assert.ok(html.includes(keepJp), 'Japan CTA must keep original Japan fundraiser');

const ctaStart = html.indexOf('<!-- CTA -->');
const ctaEnd = html.indexOf('<!-- FOOTER -->');
assert.ok(ctaStart > 0 && ctaEnd > ctaStart);
const ctaSection = html.slice(ctaStart, ctaEnd);

const unifiedMatches = ctaSection.split(unified).length - 1;
assert.strictEqual(unifiedMatches, 6, 'CTA section should have 6 unified GoFundMe links (Montreal, Conchagua, China, Quebec, Brazil, Mykonos)');

assert.ok(!ctaSection.includes('skatepark-city-montreal'), 'Montreal should not use old dedicated URL');
assert.ok(!ctaSection.includes('skatepark-city-on-a-volcano'), 'Conchagua should not use old dedicated URL');
assert.ok(!ctaSection.includes('skate-city-china'), 'China card should not use old dedicated URL');

console.log('ok: skatepark-city CTA GoFundMe URL rules passed');
