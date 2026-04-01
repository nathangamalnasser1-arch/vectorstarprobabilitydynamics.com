/**
 * Unit tests for Jayden E-Commerce consultant landing page.
 * Run with: node tests/jayden-ecommerce.test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'jayden-ecommerce.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const required = {
  title: /Jayden.*E-Commerce Consultant/i,
  rateHero: /\$50\/h.*minimum\s+3\s+hours/i,
  rateContact: /Rates[\s\S]*\$50\/h.*minimum\s+3\s+hours/i,
  contactSection: /id="contact"/,
};

let failed = 0;
for (const [name, re] of Object.entries(required)) {
  const ok = re.test(html);
  if (!ok) {
    console.error('FAIL:', name);
    failed++;
  } else {
    console.log('OK:', name);
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll Jayden E-Commerce page tests passed.');
process.exit(0);
