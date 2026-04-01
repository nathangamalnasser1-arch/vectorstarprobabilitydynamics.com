/**
 * Unit tests: Jayden ecommerce consulting rate copy.
 * Run with: node tests/jayden-ecommerce.test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'jayden-ecommerce.html');
const html = fs.readFileSync(htmlPath, 'utf8');

let failed = 0;

const checks = [
  { name: 'hourlyRate', re: /\$50\/hr/i },
  { name: 'minimumHours', re: /minimum[^\n]{0,40}3\s+hours/i },
  { name: 'contactRateLine', re: /\$50\/hr\s*·\s*3\s+hr\s+minimum/i },
];

for (const { name, re } of checks) {
  if (!re.test(html)) {
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
console.log('\nAll Jayden ecommerce rate tests passed.');
process.exit(0);
